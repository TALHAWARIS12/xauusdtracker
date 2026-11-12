import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatIntaSendPhoneNumber,
  verifyIntaSendWebhookChallenge,
  createIntaSendCheckoutSession,
  verifyIntaSendPayment,
} from "../lib/intasend";

describe("IntaSend Integration Helper Library", () => {
  describe("formatIntaSendPhoneNumber", () => {
    it("converts Kenyan 07xx local numbers to 2547xx format", () => {
      expect(formatIntaSendPhoneNumber("0712345678")).toBe("254712345678");
    });

    it("converts Kenyan 01xx local numbers to 2541xx format", () => {
      expect(formatIntaSendPhoneNumber("0112345678")).toBe("254112345678");
    });

    it("strips leading plus sign from +254...", () => {
      expect(formatIntaSendPhoneNumber("+254712345678")).toBe("254712345678");
    });

    it("handles already formatted 254 numbers", () => {
      expect(formatIntaSendPhoneNumber("254712345678")).toBe("254712345678");
    });

    it("cleans spaces and hyphens", () => {
      expect(formatIntaSendPhoneNumber("0712-345 678")).toBe("254712345678");
    });

    it("returns empty string if phone is empty or undefined", () => {
      expect(formatIntaSendPhoneNumber("")).toBe("");
    });

    it("returns empty string if phone contains email address", () => {
      expect(formatIntaSendPhoneNumber("testuser@gmail.com")).toBe("");
    });

    it("returns empty string if phone is less than 9 digits", () => {
      expect(formatIntaSendPhoneNumber("12345")).toBe("");
    });
  });

  describe("verifyIntaSendWebhookChallenge", () => {
    const originalChallenge = process.env.INTASEND_CHALLENGE;

    beforeEach(() => {
      process.env.INTASEND_CHALLENGE = "my-secret-challenge-token";
    });

    it("returns true when challenge matches", () => {
      expect(verifyIntaSendWebhookChallenge("my-secret-challenge-token")).toBe(true);
    });

    it("returns false when challenge does not match", () => {
      expect(verifyIntaSendWebhookChallenge("wrong-challenge")).toBe(false);
    });

    it("returns true when no challenge is configured in env", () => {
      delete process.env.INTASEND_CHALLENGE;
      expect(verifyIntaSendWebhookChallenge("any-challenge")).toBe(true);
      process.env.INTASEND_CHALLENGE = originalChallenge;
    });
  });

  describe("createIntaSendCheckoutSession", () => {
    beforeEach(() => {
      process.env.INTASEND_PUBLISHABLE_KEY = "ISPubKey_test_dummy";
    });

    it("creates a checkout session with phone number", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "session_mpesa_123",
          url: "https://payment.intasend.com/checkout/session_mpesa_123/express/",
          methods: ["mpesa", "transfi"],
          currency: "USD",
          amount: 48,
        }),
      } as any);

      const result = await createIntaSendCheckoutSession({
        amountUsd: 48,
        email: "subscriber@example.com",
        phoneNumber: "0712345678",
        apiRef: "order_mpesa_1",
        redirectUrl: "https://xauusdtracker.com/payment/status?extra=1",
      });

      expect(fetchSpy).toHaveBeenCalled();
      const callArgs = fetchSpy.mock.calls[0];
      const sentPayload = JSON.parse(callArgs[1]?.body as string);

      expect(sentPayload.currency).toBe("USD");
      expect(sentPayload.amount).toBe(48);
      expect(sentPayload.email).toBe("subscriber@example.com");
      expect(sentPayload.phone_number).toBe("254712345678");
      expect(sentPayload.api_ref).toBe("order_mpesa_1");
      expect(sentPayload.redirect_url).toBe("https://xauusdtracker.com/payment/status");
      expect(result.url).toContain("session_mpesa_123");

      fetchSpy.mockRestore();
    });

    it("handles unified checkout without phone number specified", async () => {
      const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "session_unified_789",
          url: "https://payment.intasend.com/checkout/session_unified_789/express/",
          methods: ["pesalink", "cashapp", "transfi", "mpesa"],
          currency: "USD",
          amount: 188,
        }),
      } as any);

      const result = await createIntaSendCheckoutSession({
        amountUsd: 188,
        email: "unified@example.com",
        apiRef: "order_unified_3",
        redirectUrl: "https://xauusdtracker.com/payment/status",
      });

      expect(fetchSpy).toHaveBeenCalled();
      const sentPayload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);

      expect(sentPayload.phone_number).toBeUndefined();
      expect(sentPayload.amount).toBe(188);
      expect(result.url).toBe("https://payment.intasend.com/checkout/session_unified_789/express/");

      fetchSpy.mockRestore();
    });

    it("retries with clean base payload if phone number attempt fails with 500", async () => {
      const fetchSpy = vi
        .spyOn(global, "fetch")
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: async () => '{"type":"server_error","errors":[{"code":"error","detail":"Internal error"}]}',
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            id: "session_fallback_999",
            url: "https://payment.intasend.com/checkout/session_fallback_999/express/",
            methods: ["pesalink", "transfi", "mpesa"],
            currency: "USD",
            amount: 48,
          }),
        } as any);

      const result = await createIntaSendCheckoutSession({
        amountUsd: 48,
        email: "customer@example.com",
        phoneNumber: "0712345678",
        apiRef: "order_retry_1",
        redirectUrl: "https://xauusdtracker.com/payment/status",
      });

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(result.id).toBe("session_fallback_999");
      expect(result.url).toContain("session_fallback_999");

      fetchSpy.mockRestore();
    });

    it("throws error if INTASEND_PUBLISHABLE_KEY is missing", async () => {
      delete process.env.INTASEND_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_INTASEND_PUBLISHABLE_KEY;

      await expect(
        createIntaSendCheckoutSession({
          amountUsd: 15,
          email: "test@example.com",
          apiRef: "order_123",
          redirectUrl: "https://example.com/status",
        })
      ).rejects.toThrow("INTASEND_PUBLISHABLE_KEY is not configured.");
    });
  });
});

