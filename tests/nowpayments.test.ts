import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";
import {
  sortObjectKeys,
  computeIpnSignature,
  verifyIpnSignature,
  createInvoice,
  getAppBaseUrl,
} from "@/lib/nowpayments";

describe("NOWPayments Helper & Client Module", () => {
  const secretKey = "test_ipn_secret_key_12345";

  describe("Alphabetical Key Sorting & HMAC Signature", () => {
    it("sorts top-level keys alphabetically", () => {
      const input = { z: 1, a: 2, m: 3 };
      const sorted = sortObjectKeys(input);
      expect(Object.keys(sorted)).toEqual(["a", "m", "z"]);
    });

    it("recursively sorts nested object keys", () => {
      const input = {
        zebra: { beta: 2, alpha: 1 },
        apple: { delta: 4, charlie: 3 },
      };
      const sorted = sortObjectKeys(input);
      expect(Object.keys(sorted)).toEqual(["apple", "zebra"]);
      expect(Object.keys(sorted.apple)).toEqual(["charlie", "delta"]);
      expect(Object.keys(sorted.zebra)).toEqual(["alpha", "beta"]);
    });

    it("handles arrays and primitives without mutation", () => {
      expect(sortObjectKeys(null)).toBeNull();
      expect(sortObjectKeys(42)).toBe(42);
      expect(sortObjectKeys("hello")).toBe("hello");

      const arr = [{ b: 2, a: 1 }, { d: 4, c: 3 }];
      const sortedArr = sortObjectKeys(arr);
      expect(Object.keys(sortedArr[0])).toEqual(["a", "b"]);
      expect(Object.keys(sortedArr[1])).toEqual(["c", "d"]);
    });

    it("computes reproducible HMAC-SHA512 signature", () => {
      const payload = {
        order_id: "order_123",
        payment_status: "finished",
        payment_id: 998877,
      };

      const sig1 = computeIpnSignature(payload, secretKey);
      const sig2 = computeIpnSignature(payload, secretKey);
      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(128); // 512 bits = 64 bytes = 128 hex chars
    });

    it("computes same signature regardless of initial key order", () => {
      const payloadOrderA = {
        payment_status: "finished",
        payment_id: 12345,
        order_id: "order_xyz",
      };

      const payloadOrderB = {
        order_id: "order_xyz",
        payment_status: "finished",
        payment_id: 12345,
      };

      const sigA = computeIpnSignature(payloadOrderA, secretKey);
      const sigB = computeIpnSignature(payloadOrderB, secretKey);
      expect(sigA).toBe(sigB);
    });

    it("verifies valid signature successfully", () => {
      const payload = {
        order_id: "order_abc",
        payment_status: "confirmed",
        pay_amount: 28.0,
      };

      const validSig = computeIpnSignature(payload, secretKey);
      const isValid = verifyIpnSignature(payload, validSig, secretKey);
      expect(isValid).toBe(true);
    });

    it("rejects altered payload or incorrect signature", () => {
      const payload = {
        order_id: "order_abc",
        payment_status: "confirmed",
      };

      const validSig = computeIpnSignature(payload, secretKey);
      const tamperedPayload = { ...payload, payment_status: "failed" };

      expect(verifyIpnSignature(tamperedPayload, validSig, secretKey)).toBe(false);
      expect(verifyIpnSignature(payload, "invalid_sig", secretKey)).toBe(false);
      expect(verifyIpnSignature(payload, null, secretKey)).toBe(false);
      expect(verifyIpnSignature(payload, validSig, "wrong_secret")).toBe(false);
    });
  });

  describe("createInvoice API Caller", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      process.env.NOWPAYMENTS_API_KEY = "test_api_key_nowpay";
      process.env.NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";
    });

    it("throws an error if NOWPAYMENTS_API_KEY is not defined", async () => {
      delete process.env.NOWPAYMENTS_API_KEY;

      await expect(
        createInvoice({
          price_amount: 28,
          price_currency: "usd",
          order_id: "ord_1",
          order_description: "Monthly Pro",
          ipn_callback_url: "https://xauusdtracker.com/api/webhooks/nowpayments",
          success_url: "https://xauusdtracker.com/payment/status?order_id=ord_1&status=success",
          cancel_url: "https://xauusdtracker.com/payment/status?order_id=ord_1&status=cancelled",
        })
      ).rejects.toThrow("NOWPayments API Key is missing");
    });

    it("sends request with x-api-key header and expected payload", async () => {
      const mockResponse = {
        id: "500012345",
        order_id: "ord_test_99",
        order_description: "Monthly Pro Pass",
        price_amount: 28,
        price_currency: "usd",
        invoice_url: "https://nowpayments.io/payment/?iid=500012345",
      };

      let capturedUrl = "";
      let capturedOptions: any = null;

      global.fetch = vi.fn().mockImplementation((url, options) => {
        capturedUrl = url.toString();
        capturedOptions = options;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        });
      });

      const result = await createInvoice({
        price_amount: 28,
        price_currency: "usd",
        order_id: "ord_test_99",
        order_description: "Monthly Pro Pass",
        ipn_callback_url: "https://xauusdtracker.com/api/webhooks/nowpayments",
        success_url: "https://xauusdtracker.com/payment/status?order_id=ord_test_99&status=success",
        cancel_url: "https://xauusdtracker.com/payment/status?order_id=ord_test_99&status=cancelled",
      });

      expect(capturedUrl).toBe("https://api.nowpayments.io/v1/invoice");
      expect(capturedOptions.method).toBe("POST");
      expect(capturedOptions.headers["x-api-key"]).toBe("test_api_key_nowpay");
      expect(capturedOptions.headers["Content-Type"]).toBe("application/json");

      const parsedBody = JSON.parse(capturedOptions.body);
      expect(parsedBody.price_amount).toBe(28);
      expect(parsedBody.price_currency).toBe("usd");
      expect(parsedBody.order_id).toBe("ord_test_99");
      expect(parsedBody.order_description).toBe("Monthly Pro Pass");
      expect(parsedBody.ipn_callback_url).toBe("https://xauusdtracker.com/api/webhooks/nowpayments");

      expect(result.id).toBe("500012345");
      expect(result.invoice_url).toBe("https://nowpayments.io/payment/?iid=500012345");
    });

    it("throws explicit error when API returns HTTP error", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ message: "Invalid API key provided" }),
      });

      await expect(
        createInvoice({
          price_amount: 28,
          price_currency: "usd",
          order_id: "ord_err",
          order_description: "Test",
          ipn_callback_url: "https://xauusdtracker.com/api/webhooks/nowpayments",
          success_url: "https://xauusdtracker.com/payment/status?order_id=ord_err&status=success",
          cancel_url: "https://xauusdtracker.com/payment/status?order_id=ord_err&status=cancelled",
        })
      ).rejects.toThrow("NOWPayments API responded with status 403: Invalid API key provided");
    });
  });

  describe("getAppBaseUrl Helper", () => {
    it("returns NEXT_PUBLIC_APP_URL when configured", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://xauusdtracker.com/";
      expect(getAppBaseUrl()).toBe("https://xauusdtracker.com");
    });

    it("respects x-forwarded headers when present", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const mockReq = {
        headers: new Headers({
          "x-forwarded-host": "portal.customdomain.org",
          "x-forwarded-proto": "https",
        }),
      } as unknown as Request;

      expect(getAppBaseUrl(mockReq)).toBe("https://portal.customdomain.org");
    });
  });
});
