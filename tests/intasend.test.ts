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

