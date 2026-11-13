import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as paybillCheckoutPost } from "@/app/api/checkout/paybill/route";
import {
  approveManualPayment,
  rejectManualPayment,
  approveManualPaymentByEmail,
} from "@/actions/admin-actions";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/payment-activation", () => ({
  activateSuccessfulPayment: vi.fn(),
}));

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      payment: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      adminAuditEvent: {
        create: vi.fn(),
      },
      $transaction: vi.fn(async (ops: any[]) => Promise.all(ops)),
    },
  };
});

describe("M-Pesa Paybill (919700) Checkout & Admin Approval Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/checkout/paybill", () => {
    it("rejects guest checkout without a valid email", async () => {
      const { auth } = await import("@/auth");
      vi.mocked(auth).mockResolvedValue(null as any);

      const req = new Request("http://localhost:3000/api/checkout/paybill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: "monthly", email: "invalid-email" }),
      });

      const res = await paybillCheckoutPost(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toContain("valid email");
    });

    it("records a PENDING PAYBILL payment with Paybill 919700 & Account 0018255401 for guest user", async () => {
      const { auth } = await import("@/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(auth).mockResolvedValue(null as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user_guest_1",
        email: "buyer@example.com",
      } as any);
      vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: "pay_pb_123",
        userId: "user_guest_1",
        provider: "PAYBILL",
        providerReference: "SJK8X92P1M (0712345678)",
        amount: 48,
        currency: "USD",
        status: "PENDING",
      } as any);

      const req = new Request("http://localhost:3000/api/checkout/paybill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "monthly",
          email: "BUYER@Example.com",
          mpesaCode: "sjk8x92p1m",
          phoneNumber: "0712345678",
        }),
      });

      const res = await paybillCheckoutPost(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.orderId).toBe("pay_pb_123");
      expect(data.paybillNumber).toBe("919700");
      expect(data.accountNumber).toBe("0018255401");
      expect(data.supportEmail).toBe("Support@xauusdtracker.com");
      expect(data.amountUsd).toBe(48);

      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user_guest_1",
          provider: "PAYBILL",
          providerReference: "SJK8X92P1M (0712345678)",
          amount: 48,
          status: "PENDING",
        }),
      });
    });

    it("prevents reusing an already COMPLETED M-Pesa confirmation code", async () => {
      const { auth } = await import("@/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "user_1", email: "user@example.com" },
      } as any);

      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "pay_old_1",
        status: "COMPLETED",
      } as any);

      const req = new Request("http://localhost:3000/api/checkout/paybill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: "yearly",
          mpesaCode: "ALREADYUSED1",
        }),
      });

      const res = await paybillCheckoutPost(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toContain("already been verified");
    });
  });

  describe("Admin Manual Payment Approval Actions", () => {
    it("blocks non-admin users from approving manual payments", async () => {
      const { auth } = await import("@/auth");
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u1", role: "USER" },
      } as any);

      await expect(approveManualPayment("pay_pb_123")).rejects.toThrow(
        "Unauthorized"
      );
      await expect(rejectManualPayment("pay_pb_123")).rejects.toThrow(
        "Unauthorized"
      );
      await expect(
        approveManualPaymentByEmail({ email: "a@b.com", planId: "monthly" })
      ).rejects.toThrow("Unauthorized");
    });

    it("allows ADMIN to approve a pending Paybill payment and activates subscription", async () => {
      const { auth } = await import("@/auth");
      const { prisma } = await import("@/lib/prisma");
      const { activateSuccessfulPayment } = await import(
        "@/lib/payment-activation"
      );

      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin_1", role: "ADMIN" },
      } as any);
      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "pay_pb_123",
        userId: "user_guest_1",
        provider: "PAYBILL",
        providerReference: "SJK8X92P1M",
        amount: 188,
        status: "PENDING",
        user: { id: "user_guest_1", email: "buyer@example.com" },
      } as any);
      vi.mocked(activateSuccessfulPayment).mockResolvedValue({
        success: true,
        alreadyCompleted: false,
        isSubscribed: true,
      });
      vi.mocked(prisma.adminAuditEvent.create).mockResolvedValue({} as any);

      const res = await approveManualPayment("pay_pb_123", "Verified screenshot");
      expect(res.success).toBe(true);
      expect(res.email).toBe("buyer@example.com");
      expect(res.amount).toBe(188);

      expect(activateSuccessfulPayment).toHaveBeenCalledWith(
        "pay_pb_123",
        "SJK8X92P1M"
      );
      expect(prisma.adminAuditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminUserId: "admin_1",
          targetUserId: "user_guest_1",
          action: "APPROVE_MANUAL_PAYMENT",
          reason: "Verified screenshot",
        }),
      });
    });

    it("allows ADMIN to reject a pending Paybill payment", async () => {
      const { auth } = await import("@/auth");
      const { prisma } = await import("@/lib/prisma");

      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin_1", role: "ADMIN" },
      } as any);
      vi.mocked(prisma.payment.findUnique).mockResolvedValue({
        id: "pay_pb_bad",
        userId: "user_2",
        provider: "PAYBILL",
        providerReference: "FAKECODE",
        amount: 48,
        status: "PENDING",
        user: { id: "user_2", email: "fake@example.com" },
      } as any);
      vi.mocked(prisma.payment.update).mockResolvedValue({} as any);
      vi.mocked(prisma.adminAuditEvent.create).mockResolvedValue({} as any);

      const res = await rejectManualPayment("pay_pb_bad", "No funds received");
      expect(res.success).toBe(true);
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay_pb_bad" },
        data: { status: "FAILED" },
      });
      expect(prisma.adminAuditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "REJECT_MANUAL_PAYMENT",
          reason: "No funds received",
        }),
      });
    });

    it("allows ADMIN to directly approve by email even if user had not registered yet", async () => {
      const { auth } = await import("@/auth");
      const { prisma } = await import("@/lib/prisma");
      const { activateSuccessfulPayment } = await import(
        "@/lib/payment-activation"
      );

      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin_1", role: "ADMIN" },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "user_new_99",
        email: "newvip@example.com",
      } as any);
      vi.mocked(prisma.payment.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.payment.create).mockResolvedValue({
        id: "pay_direct_99",
        userId: "user_new_99",
        provider: "PAYBILL",
        providerReference: "MPESA999",
        amount: 48,
        status: "PENDING",
      } as any);
      vi.mocked(activateSuccessfulPayment).mockResolvedValue({
        success: true,
        alreadyCompleted: false,
        isSubscribed: true,
      });
      vi.mocked(prisma.adminAuditEvent.create).mockResolvedValue({} as any);

      const res = await approveManualPaymentByEmail({
        email: "NewVIP@Example.com",
        planId: "monthly",
        reference: "mpesa999",
      });

      expect(res.success).toBe(true);
      expect(res.email).toBe("newvip@example.com");
      expect(res.createdNewAccount).toBe(true);
      expect(res.reference).toBe("MPESA999");
      expect(activateSuccessfulPayment).toHaveBeenCalledWith(
        "pay_direct_99",
        "MPESA999"
      );
    });
  });
});

