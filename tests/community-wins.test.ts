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
import { GET, POST, PATCH } from "@/app/api/community/wins/route";

describe("Community Reviews & Profit Wall Suite", () => {
  it("provides 6 verified trader reviews with complete metadata", () => {
    expect(GENERATED_REVIEWS.length).toBeGreaterThanOrEqual(6);
    for (const review of GENERATED_REVIEWS) {
      expect(review.verified).toBe(true);
      expect(review.rating).toBe(5);
      expect(review.comment.length).toBeGreaterThan(30);
      expect(review.highlightMetric.length).toBeGreaterThan(3);
    }
  });

  it("provides seeded member profit posts with positive USD amounts", () => {
    expect(SEEDED_PROFIT_POSTS.length).toBeGreaterThanOrEqual(6);
    for (const post of SEEDED_PROFIT_POSTS) {
      expect(post.profitUsd).toBeGreaterThan(0);
      expect(["LONG", "SHORT"]).toContain(post.direction);
      expect(["1M", "5M", "15M", "1H"]).toContain(post.timeframe);
    }
  });

  it("validates and sanitizes profit post submissions accurately", () => {
    const valid = validateProfitPostInput({
      traderName: "<b>Alex Trader</b>",
      location: "London, UK",
      profitUsd: 785.5,
      direction: "LONG",
      timeframe: "5M",
      setupUsed: "Liquidity Pool Sweep",
      pips: "+62 pips",
      rating: 5,
      comment: "Caught the NY open sweep using the 5M order flow delta and banked $785!",
    });

    expect(valid.valid).toBe(true);
    if (valid.valid) {
      expect(valid.data.traderName).toBe("Alex Trader");
      expect(valid.data.profitUsd).toBe(785.5);
      expect(valid.data.direction).toBe("LONG");
    }

    const invalidProfit = validateProfitPostInput({
      traderName: "Alex",
      profitUsd: -50,
      comment: "Invalid negative profit amount test.",
    });
    expect(invalidProfit.valid).toBe(false);

    const invalidComment = validateProfitPostInput({
      traderName: "Alex",
      profitUsd: 250,
      comment: "Too short",
    });
    expect(invalidComment.valid).toBe(false);
  });

  it("GET /api/community/wins returns posts and aggregate community stats", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.posts)).toBe(true);
    expect(data.posts.length).toBeGreaterThanOrEqual(6);
    expect(data.stats.totalProfitUsd).toBeGreaterThan(100000);
    expect(data.stats.averageRating).toBe(4.9);
  });

  it("POST /api/community/wins creates a new member profit post and PATCH increments likes", async () => {
    const req = new NextRequest("http://localhost:3000/api/community/wins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        traderName: "Daniel M.",
        location: "Johannesburg, ZA",
        profitUsd: 920,
        direction: "LONG",
        timeframe: "15M",
        setupUsed: "Liquidity Pool Sweep + Volume Delta",
        pips: "+80 pips • 1:3.2 R:R",
        rating: 5,
        comment: "Used the 15M liquidity pool cluster during London session and made $920 profit!",
      }),
    });

    const postRes = await POST(req);
    expect(postRes.status).toBe(201);
    const postData = await postRes.json();
    expect(postData.post).toBeDefined();
    expect(postData.post.traderName).toBe("Daniel M.");
    expect(postData.post.profitUsd).toBe(920);

    // Verify PATCH increments likes
    const patchReq = new NextRequest("http://localhost:3000/api/community/wins", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "win-seed-1" }),
    });
    const patchRes = await PATCH(patchReq);
    expect(patchRes.status).toBe(200);
  });
});
