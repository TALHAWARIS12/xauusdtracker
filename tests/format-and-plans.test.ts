import { describe, it, expect } from "vitest";
import {
  formatUtcTimestamp,
  formatCompactUsd,
  formatRoughUsd,
  roundShare,
  toPercentPair,
  formatSignedPct,
  formatSignedUsd,
} from "@/lib/market/format";
import { PRICING_PLANS, getPlanById } from "@/lib/plan-config";

describe("Market Format Helpers", () => {
  it("formats UTC timestamp in YYYY-MM-DD HH:mm:ss UTC format", () => {
    const fixedDate = new Date(Date.UTC(2026, 9, 20, 14, 30, 45));
    expect(formatUtcTimestamp(fixedDate)).toBe("2026-10-20 14:30:45 UTC");
  });

  it("formats compact USD amounts correctly", () => {
    expect(formatCompactUsd(1_420_000_000)).toBe("$1.42B");
    expect(formatCompactUsd(150_500_000)).toBe("$150.5M");
    expect(formatCompactUsd(48_500)).toBe("$48.5K");
    expect(formatCompactUsd(2714.85)).toBe("$2.7K");
    expect(formatCompactUsd(null)).toBe("—");
  });

  it("formats rough USD estimates for free tier", () => {
    expect(formatRoughUsd(131_742_118)).toBe("~$130M");
    expect(formatRoughUsd(1_420_000_000)).toBe("~$1.40B");
    expect(formatRoughUsd(null)).toBe("—");
  });

  it("rounds buyer/seller shares to steps", () => {
    expect(roundShare(0.63, 0.05)).toBeCloseTo(0.65);
    expect(roundShare(0.38, 0.05)).toBeCloseTo(0.40);
  });

  it("converts shares into percent pairs summing to 100", () => {
    const { left, right } = toPercentPair(0.62);
    expect(left).toBe(62);
    expect(right).toBe(38);
    expect(left + right).toBe(100);
  });

  it("formats signed percentages and USD", () => {
    expect(formatSignedPct(0.0064)).toBe("+0.64%");
    expect(formatSignedPct(-0.0125)).toBe("-1.25%");
    expect(formatSignedUsd(17.2)).toBe("+$17.20");
    expect(formatSignedUsd(-14.5)).toBe("-$14.50");
  });
});

describe("Pricing Matrix Configuration", () => {
  it("contains all 4 requested intervals", () => {
    const intervals = PRICING_PLANS.map((p) => p.interval);
    expect(intervals).toEqual(["day", "week", "month", "year"]);
  });

  it("configures the exact requested prices", () => {
    const daily = getPlanById("daily");
    expect(daily.priceUsd).toBe(3);

    const weekly = getPlanById("weekly");
    expect(weekly.priceUsd).toBe(10);

    const monthly = getPlanById("monthly");
    expect(monthly.priceUsd).toBe(28);
    expect(monthly.isPopular).toBe(true);

    const yearly = getPlanById("yearly");
    expect(yearly.priceUsd).toBe(88);
    expect(yearly.badge).toContain("Save 74%");
  });
});
