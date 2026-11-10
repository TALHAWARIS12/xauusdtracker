import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: {
    tradeSetup: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation(async ({ data }: any) => ({
        id: "test-win-id-1",
        ...data,
        createdAt: new Date(),
      })),
      update: vi.fn().mockResolvedValue({}),
    },
  },
}));

import {
  GENERATED_REVIEWS,
  SEEDED_PROFIT_POSTS,
  validateProfitPostInput,
} from "@/lib/community/reviews-and-wins";
import {
  computeCountryBreakdown,
  inferUserCountry,
} from "@/lib/analytics/geo-intelligence";
import { GET, POST, PATCH } from "@/app/api/community/wins/route";

describe("Community Reviews, Profit-Only Wall & Admin Account Country Breakdown", () => {
  it("provides 6 verified trader reviews with complete metadata", () => {
    expect(GENERATED_REVIEWS.length).toBeGreaterThanOrEqual(6);
    for (const review of GENERATED_REVIEWS) {
      expect(review.verified).toBe(true);
      expect(review.rating).toBe(5);
      expect(review.comment.length).toBeGreaterThan(30);
      expect(review.highlightMetric.length).toBeGreaterThan(3);
    }
  });

  it("provides big seeded member profit posts with positive USD amounts only", () => {
    expect(SEEDED_PROFIT_POSTS.length).toBeGreaterThanOrEqual(6);
    for (const post of SEEDED_PROFIT_POSTS) {
      expect(post.profitUsd).toBeGreaterThanOrEqual(4000);
      expect(post.direction).toBe("LONG");
    }
  });

  it("allows posting with ONLY name and profit made, and strictly rejects losses", () => {
    const validMinimal = validateProfitPostInput({
      traderName: "<b>Alex M.</b>",
      profitUsd: 5250,
    });

    expect(validMinimal.valid).toBe(true);
    if (validMinimal.valid) {
      expect(validMinimal.data.traderName).toBe("Alex M.");
      expect(validMinimal.data.profitUsd).toBe(5250);
    }

    const negativeNumberLoss = validateProfitPostInput({
      traderName: "Alex",
      profitUsd: -200,
    });
    expect(negativeNumberLoss.valid).toBe(false);

    const negativeStringLoss = validateProfitPostInput({
      traderName: "Alex",
      profitUsd: "-450",
    });
    expect(negativeStringLoss.valid).toBe(false);

    const zeroProfit = validateProfitPostInput({
      traderName: "Alex",
      profitUsd: 0,
    });
    expect(zeroProfit.valid).toBe(false);
  });

  it("GET /api/community/wins returns big community profit numbers (> $1.4M)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.posts)).toBe(true);
    expect(data.posts.length).toBeGreaterThanOrEqual(6);
    expect(data.stats.totalProfitUsd).toBeGreaterThan(1400000);
    expect(data.stats.totalWinsCount).toBeGreaterThanOrEqual(2840);
  });

  it("POST /api/community/wins creates a profit post from only name and profit made", async () => {
    const req = new NextRequest("http://localhost:3000/api/community/wins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traderName: "Daniel M.",
        profitUsd: 8500,
      }),
    });

    const postRes = await POST(req);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.post).toBeDefined();
    expect(postData.post.traderName).toBe("Daniel M.");
    expect(postData.post.profitUsd).toBe(8500);

    const patchReq = new NextRequest("http://localhost:3000/api/community/wins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "win-seed-1" }),
    });
    const patchRes = await PATCH(patchReq);
    expect(patchRes.status).toBe(200);
  });

  it("computes accurate geographic country breakdown for registered accounts", () => {
    const keUser = inferUserCountry({
      userId: "u1",
      email: "trader@safaricom.co.ke",
    });
    expect(keUser.code).toBe("KE");
    expect(keUser.name).toBe("Kenya");

    const ukUser = inferUserCountry({
      userId: "u2",
      email: "desk@fund.co.uk",
    });
    expect(ukUser.code).toBe("GB");

    const breakdownResult = computeCountryBreakdown([
      { id: "u1", email: "a@safaricom.co.ke", isPro: true },
      { id: "u2", email: "b@gmail.com", isPro: false, recordedCountryCode: "KE" },
      { id: "u3", email: "c@desk.co.uk", isPro: true },
      { id: "u4", email: "d@gmail.com", isPro: false, paymentCurrencies: ["NGN"] },
    ]);

    expect(breakdownResult.topCountry?.code).toBe("KE");
    expect(breakdownResult.topCountry?.accountCount).toBe(2);
    expect(breakdownResult.breakdown.length).toBe(3);
  });
});
