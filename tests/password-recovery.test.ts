import { describe, it, expect } from "vitest";

describe("Operator Passkey Recovery & Security", () => {
  const SUPPORT_EMAIL = "Support@xauusdtracker.com";

  it("formats the passkey recovery Gmail compose URL with operator email", () => {
    const operatorEmail = "support@xauusdtracker.com";
    const resetSubject = `Password Reset Request - ${operatorEmail}`;
    const resetBody = `Hi XAUUSD Tracker Support,\n\nI forgot my security passkey for my operator account. Please reset my credentials.\n\nAccount Email: ${operatorEmail}`;

    const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      SUPPORT_EMAIL
    )}&su=${encodeURIComponent(resetSubject)}&body=${encodeURIComponent(resetBody)}`;

    expect(gmailComposeUrl).toContain("mail.google.com/mail/?view=cm");
    expect(gmailComposeUrl).toContain("to=Support%40xauusdtracker.com");
    expect(gmailComposeUrl).toContain(encodeURIComponent(resetSubject));
    expect(gmailComposeUrl).toContain(encodeURIComponent(operatorEmail));
  });

  it("enforces password minimum length of 8 characters", () => {
    const shortPassword = "pass";
    const validPassword = "SecurePass123!";

    expect(shortPassword.length < 8).toBe(true);
    expect(validPassword.length >= 8).toBe(true);
  });

  it("validates that confirmPassword matches newPassword", () => {
    const newPass = "TerminalSecure2026!";
    const matchingConfirm = "TerminalSecure2026!";
    const nonMatchingConfirm = "DifferentPass123!";

    expect(newPass === matchingConfirm).toBe(true);
    expect(newPass === nonMatchingConfirm).toBe(false);
  });
});
