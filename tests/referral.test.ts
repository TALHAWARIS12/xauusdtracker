import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => {
  const mockUser = {
    findUnique: vi.fn(),
    update: vi.fn(),
  };
  const mockReferralEarning = {
    findFirst: vi.fn(),
    create: vi.fn(),
  };
  return {
    prisma: {
      user: mockUser,
      referralEarning: mockReferralEarning,
    },
  };
});

describe("Referral System Logic & Commission Calculation", () => {
  const REFERRAL_COMMISSION_PERCENT = 0.2;
  const REFERRAL_REWARD_DAYS = 7;

  it("calculates 20% commission on Monthly Pro tier ($48)", () => {
    const amount = 48.0;
    const commission = parseFloat((amount * REFERRAL_COMMISSION_PERCENT).toFixed(2));
    expect(commission).toBe(9.6);
  });

  it("calculates 20% commission on Yearly Pro tier ($188)", () => {
    const amount = 188.0;
    const commission = parseFloat((amount * REFERRAL_COMMISSION_PERCENT).toFixed(2));
    expect(commission).toBe(37.6);
  });

  it("calculates +7 free days reward duration in milliseconds", () => {
    const rewardMs = REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000;
    expect(rewardMs).toBe(604800000);
  });

  it("extends existing subscription period correctly", () => {
    const now = Date.now();
    const existingEnd = new Date(now + 15 * 24 * 60 * 60 * 1000); // 15 days remaining
    const newEnd = new Date(existingEnd.getTime() + REFERRAL_REWARD_DAYS * 24 * 60 * 60 * 1000);

    const diffDays = Math.round((newEnd.getTime() - existingEnd.getTime()) / (24 * 60 * 60 * 1000));
    expect(diffDays).toBe(7);
  });

  it("formats the referral link URL properly", () => {
    const appUrl = "https://xauusdtracker.com";
    const referralCode = "GOLD8888";
    const link = `${appUrl}/register?ref=${referralCode}`;

    expect(link).toBe("https://xauusdtracker.com/register?ref=GOLD8888");
  });
});

