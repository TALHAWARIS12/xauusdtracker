import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as checkoutHandler } from "@/app/api/checkout/nowpayments/route";
import { POST as webhookHandler } from "@/app/api/webhooks/nowpayments/route";
import { GET as statusHandler } from "@/app/api/payment/status/route";
import { computeIpnSignature } from "@/lib/nowpayments";
import { NextRequest } from "next/server";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => {
  const mockPayment = {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const mockSubscription = {
    upsert: vi.fn(),
    update: vi.fn(),
  };
  const mockPlan = {
    findUnique: vi.fn(),
  };
  return {
    prisma: {
      payment: mockPayment,
      subscription: mockSubscription,
      plan: mockPlan,
      $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
    },
  };
});

// Mock createInvoice
vi.mock("@/lib/nowpayments", async (importOriginal) => {
  const original = (await importOriginal()) as any;
  return {
    ...original,
    createInvoice: vi.fn(),
  };
});

describe("NOWPayments API Route Handlers", () => {
  const IPN_SECRET = "test_ipn_secret_for_routes";

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.NOWPAYMENTS_IPN_SECRET = IPN_SECRET;
  });

  describe("Checkout Route: POST /api/checkout/nowpayments", () => {
    it("returns 401 if user is not authenticated", async () => {
      const { auth } = await import("@/auth");
      vi.mocked(auth).mockResolvedValue(null as any);

      const req = new Request("http://localhost:3000/api/checkout/nowpayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "monthly" }),
      });

      const response = await checkoutHandler(req);
      expect(response.status).toBe(401);

      const body = await response.json();
      expect(body.error).toContain("Unauthorized");
    });

    it("returns 400 if planId is missing or invalid", async () => {
      const { auth } = await import("@/auth");
      vi.mocked(auth).mockResolvedValue({ user: { id: "user_test_1" } } as any);

      const req = new Request("http://localhost:3000/api/checkout/nowpayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const response = await checkoutHandler(req);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("planId");
    });

    it("creates pending payment, initializes invoice, updates record, and returns checkoutUrl", async () => {
      const { auth } = await import("@/auth");
      const { prisma } = await import("@/lib/prisma");
      const { createInvoice } = await import("@/lib/nowpayments");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_test_1", email: "trader@gold.com" },
      } as any);

      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: "pay_order_cuid_123",
        userId: "user_test_1",
        provider: "NOWPAYMENTS",
        amount: 28,
        currency: "USD",
        status: "PENDING",
      } as any);

      vi.mocked(createInvoice).mockResolvedValue({
        id: "invoice_np_999",
        order_id: "pay_order_cuid_123",
        order_description: "XAUUSD Intelligence - Monthly Pro (/ month)",
        price_amount: 28,
        price_currency: "usd",
        invoice_url: "https://nowpayments.io/payment/?iid=invoice_np_999",
      });

      vi.mocked(prisma.payment.update).mockResolvedValue({} as any);

      const req = new Request("http://localhost:3000/api/checkout/nowpayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "monthly" }),
      });

      const response = await checkoutHandler(req);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.checkoutUrl).toBe("https://nowpayments.io/payment/?iid=invoice_np_999");
      expect(body.orderId).toBe("pay_order_cuid_123");
      expect(body.invoiceId).toBe("invoice_np_999");

      // Verify Prisma Payment was created with PENDING
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user_test_1",
          provider: "NOWPAYMENTS",
          amount: 28,
          status: "PENDING",
        }),
      });

      // Verify Payment record was updated with invoice ID
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay_order_cuid_123" },
        data: { providerReference: "invoice_np_999" },
      });
    });
  });

  describe("IPN Webhook Route: POST /api/webhooks/nowpayments", () => {
    it("returns 401 if x-nowpayments-sig header is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/webhooks/nowpayments", {
        method: "POST",
        body: JSON.stringify({ order_id: "ord_1" }),
      });

      const response = await webhookHandler(req);
      expect(response.status).toBe(401);
    });

    it("returns 401 if signature does not match computed HMAC-SHA512", async () => {
      const payload = { order_id: "ord_1", payment_status: "finished" };
      const req = new NextRequest("http://localhost:3000/api/webhooks/nowpayments", {
        method: "POST",
        headers: {
          "x-nowpayments-sig": "bad_signature_digest_12345",
        },
        body: JSON.stringify(payload),
      });

      const response = await webhookHandler(req);
      expect(response.status).toBe(401);
    });

    it("returns 404 if order_id is not found in database", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);

      const payload = {
        order_id: "non_existent_order",
        payment_status: "finished",
        payment_id: 112233,
      };
      const validSig = computeIpnSignature(payload, IPN_SECRET);

      const req = new NextRequest("http://localhost:3000/api/webhooks/nowpayments", {
        method: "POST",
        headers: {
          "x-nowpayments-sig": validSig,
        },
        body: JSON.stringify(payload),
      });

      const response = await webhookHandler(req);
      expect(response.status).toBe(404);
    });

    it("returns 200 immediately for idempotent duplicate calls if transaction already completed", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: "order_done_123",
        userId: "user_1",
        status: "COMPLETED",
        amount: 28,
        user: { subscription: { status: "ACTIVE" } },
      } as any);

      const payload = {
        order_id: "order_done_123",
        payment_status: "finished",
        payment_id: 999999,
      };
      const validSig = computeIpnSignature(payload, IPN_SECRET);

      const req = new NextRequest("http://localhost:3000/api/webhooks/nowpayments", {
        method: "POST",
        headers: { "x-nowpayments-sig": validSig },
        body: JSON.stringify(payload),
      });

      const response = await webhookHandler(req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.message).toContain("already processed");

      // Verify no extra DB update was triggered
      expect(prisma.payment.update).not.toHaveBeenCalled();
    });

    it("activates subscription and updates transaction to COMPLETED on 'finished' status", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: "order_pay_777",
        userId: "user_gold_trader",
        status: "PENDING",
        amount: 28,
        user: {
          id: "user_gold_trader",
          subscription: null,
        },
      } as any);

      vi.mocked(prisma.payment.update).mockResolvedValue({} as any);
      vi.mocked(prisma.subscription.upsert).mockResolvedValue({} as any);

      const payload = {
        order_id: "order_pay_777",
        payment_status: "finished",
        payment_id: 887766,
      };
      const validSig = computeIpnSignature(payload, IPN_SECRET);

      const req = new NextRequest("http://localhost:3000/api/webhooks/nowpayments", {
        method: "POST",
        headers: { "x-nowpayments-sig": validSig },
        body: JSON.stringify(payload),
      });

      const response = await webhookHandler(req);
      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body.success).toBe(true);
      expect(body.status).toBe("completed");

      // Verify transaction marked as COMPLETED
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order_pay_777" },
          data: expect.objectContaining({
            status: "COMPLETED",
            providerReference: "887766",
          }),
        })
      );

      // Verify subscription activated
      expect(prisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user_gold_trader" },
          create: expect.objectContaining({
            status: "ACTIVE",
          }),
        })
      );
    });

    it("updates transaction to FAILED on 'failed' or 'expired' status without activating subscription", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: "order_fail_999",
        userId: "user_2",
        status: "PENDING",
        amount: 28,
        user: { subscription: null },
      } as any);

      vi.mocked(prisma.payment.update).mockResolvedValue({} as any);

      const payload = {
        order_id: "order_fail_999",
        payment_status: "expired",
        payment_id: 443322,
      };
      const validSig = computeIpnSignature(payload, IPN_SECRET);

      const req = new NextRequest("http://localhost:3000/api/webhooks/nowpayments", {
        method: "POST",
        headers: { "x-nowpayments-sig": validSig },
        body: JSON.stringify(payload),
      });

      const response = await webhookHandler(req);
      expect(response.status).toBe(200);

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order_fail_999" },
          data: expect.objectContaining({
            status: "FAILED",
          }),
        })
      );

      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });

    it("keeps transaction as PENDING on 'waiting' or 'confirming' status", async () => {
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: "order_waiting_111",
        userId: "user_3",
        status: "PENDING",
        amount: 88,
        user: { subscription: null },
      } as any);

      vi.mocked(prisma.payment.update).mockResolvedValue({} as any);

      const payload = {
        order_id: "order_waiting_111",
        payment_status: "confirming",
        payment_id: 111222,
      };
      const validSig = computeIpnSignature(payload, IPN_SECRET);

      const req = new NextRequest("http://localhost:3000/api/webhooks/nowpayments", {
        method: "POST",
        headers: { "x-nowpayments-sig": validSig },
        body: JSON.stringify(payload),
      });

      const response = await webhookHandler(req);
      expect(response.status).toBe(200);

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "order_waiting_111" },
          data: expect.objectContaining({
            status: "PENDING",
          }),
        })
      );

      expect(prisma.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe("Payment Status Polling Route: GET /api/payment/status", () => {
    it("returns 400 if order_id is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/payment/status");
      const response = await statusHandler(req);
      expect(response.status).toBe(400);
    });

    it("returns 404 if order_id does not exist", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.payment.findFirst).mockResolvedValue(null);

      const req = new NextRequest("http://localhost:3000/api/payment/status?order_id=unknown_123");
      const response = await statusHandler(req);
      expect(response.status).toBe(404);
    });

    it("returns payment record and subscription status when found", async () => {
      const { prisma } = await import("@/lib/prisma");
      vi.mocked(prisma.payment.findFirst).mockResolvedValue({
        id: "ord_verified_123",
        status: "COMPLETED",
        amount: 28,
        currency: "USD",
        provider: "NOWPAYMENTS",
        confirmedAt: new Date("2026-10-24T00:00:00Z"),
        createdAt: new Date("2026-10-24T00:00:00Z"),
        user: {
          id: "u1",
          email: "test@xau.com",
          subscription: {
            status: "ACTIVE",
            currentPeriodEnd: new Date(Date.now() + 86400000),
          },
        },
      } as any);

      const req = new NextRequest(
        "http://localhost:3000/api/payment/status?order_id=ord_verified_123"
      );
      const response = await statusHandler(req);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.found).toBe(true);
      expect(data.status).toBe("COMPLETED");
      expect(data.amount).toBe(28);
      expect(data.isSubscribed).toBe(true);
    });
  });
});
