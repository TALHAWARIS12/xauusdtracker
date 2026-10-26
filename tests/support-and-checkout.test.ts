import { describe, it, expect, vi } from "vitest";
import { POST as stripeCheckoutPost } from "@/app/api/stripe/checkout/route";
import { POST as stripeWebhookPost } from "@/app/api/webhooks/stripe/route";

describe("Support Desk & Email Integrity", () => {
  const SUPPORT_EMAIL = "Support@xauusdtracker.com";

  it("verifies the exact support email address", () => {
    expect(SUPPORT_EMAIL.toLowerCase()).toBe("support@xauusdtracker.com");
  });

  it("generates valid Gmail compose URL prefilled with complaint subject and body", () => {
    const subject = "Complaint: General Feedback & Inquiry - XAUUSD Tracker";
    const body = "Hi XAUUSD Tracker Support,\n\nI would like to file a complaint regarding:\n\n";

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      SUPPORT_EMAIL
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    expect(gmailUrl).toContain("mail.google.com/mail/?view=cm");
    expect(gmailUrl).toContain("to=Support%40xauusdtracker.com");
    expect(gmailUrl).toContain("Complaint");
  });
});

describe("Stripe Deprecation & Crypto Gateway Exclusivity", () => {
  it("safely handles legacy stripe checkout requests by redirecting to crypto checkout", async () => {
    const res = await stripeCheckoutPost();
    const data = await res.json();
    expect(data.url).toBe("/checkout?plan=monthly");
  });

  it("safely acknowledges legacy stripe webhook calls without error", async () => {
    const res = await stripeWebhookPost();
    const data = await res.json();
    expect(data.received).toBe(true);
    expect(data.message).toContain("NOWPayments crypto gateway");
  });
});
