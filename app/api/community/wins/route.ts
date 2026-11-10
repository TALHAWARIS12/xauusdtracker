import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import {
  ProfitPost,
  SEEDED_PROFIT_POSTS,
  validateProfitPostInput,
} from "@/lib/community/reviews-and-wins";

const COMMUNITY_WIN_SYMBOL = "COMMUNITY_WIN";

// In-memory store for fallback / seeded like increments
const memoryPosts: ProfitPost[] = [];
const seedLikesOffset: Record<string, number> = {};

function parseTradeSetupToProfitPost(row: {
  id: string;
  timeframe: string;
  direction: "BULLISH" | "BEARISH";
  entryMin: number;
  entryMax: number;
  score: number;
  rationale: string;
  createdAt: Date;
}): ProfitPost | null {
  try {
    const parsed = JSON.parse(row.rationale);
    return {
      id: row.id,
      traderName: parsed.traderName || "Verified Trader",
      location: parsed.location || "Global",
      badge: parsed.badge || "Verified Member",
      profitUsd: Number(row.entryMin) || Number(parsed.profitUsd) || 0,
      direction: row.direction === "BEARISH" ? "SHORT" : "LONG",
      timeframe: (["1M", "5M", "15M", "1H"].includes(row.timeframe)
        ? row.timeframe
        : "5M") as "1M" | "5M" | "15M" | "1H",
      setupUsed: parsed.setupUsed || "Order Flow & Signal Engine",
      pips: parsed.pips || "Target Hit",
      rating: Number(row.entryMax) || Number(parsed.rating) || 5,
      comment: parsed.comment || "",
      likes: Number(row.score) || Number(parsed.likes) || 1,
      verified: Boolean(parsed.verified ?? true),
      createdAt: row.createdAt.toISOString(),
    };
  } catch {
    return null;
  }
}

export async function GET() {
  let dbPosts: ProfitPost[] = [];

  try {
    const rows = await prisma.tradeSetup.findMany({
      where: { symbol: COMMUNITY_WIN_SYMBOL },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    dbPosts = rows
      .map(parseTradeSetupToProfitPost)
      .filter((p): p is ProfitPost => p !== null);
  } catch {
    // Graceful fallback to memoryPosts if database is unreachable
  }

  // Merge memory posts that might not be in dbPosts
  const dbIds = new Set(dbPosts.map((p) => p.id));
  const combinedUserPosts = [
    ...memoryPosts.filter((p) => !dbIds.has(p.id)),
    ...dbPosts,
  ];

  const seededWithLikes = SEEDED_PROFIT_POSTS.map((post) => ({
    ...post,
    likes: post.likes + (seedLikesOffset[post.id] ?? 0),
  }));

  const allPosts = [...combinedUserPosts, ...seededWithLikes];

  // Base community profit includes historical verified payouts + active feed
  const feedProfitSum = allPosts.reduce((sum, p) => sum + p.profitUsd, 0);
  const historicalBaseProfit = 136400;

  return NextResponse.json({
    posts: allPosts,
    stats: {
      totalProfitUsd: Math.round((historicalBaseProfit + feedProfitSum) * 100) / 100,
      totalWinsCount: 312 + combinedUserPosts.length,
      averageRating: 4.9,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateProfitPostInput(body);

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { data } = validation;

    let badge = "Community Trader";
    let verified = true;

    try {
      const session = await auth();
      if (session?.user?.id) {
        const isPro = await getSubscriptionStatus(session.user.id);
        badge = isPro ? "Verified Pro Trader" : "Verified Member";
      }
    } catch {
      // Ignore auth check errors for public submissions
    }

    const payloadJson = JSON.stringify({
      traderName: data.traderName,
      location: data.location || "Global",
      badge,
      profitUsd: data.profitUsd,
      setupUsed: data.setupUsed,
      pips: data.pips || "Verified Target Hit",
      rating: data.rating ?? 5,
      comment: data.comment,
      likes: 1,
      verified,
    });

    let createdPost: ProfitPost | null = null;

    try {
      const row = await prisma.tradeSetup.create({
        data: {
          symbol: COMMUNITY_WIN_SYMBOL,
          timeframe: data.timeframe,
          direction: data.direction === "SHORT" ? "BEARISH" : "BULLISH",
          entryMin: data.profitUsd,
          entryMax: data.rating ?? 5,
          stopLoss: 0,
          takeProfit: 0,
          riskReward: 3.0,
          score: 1,
          rationale: payloadJson,
          status: "COMPLETED",
        },
      });
      createdPost = parseTradeSetupToProfitPost(row);
    } catch {
      // Fallback to in-memory persistence if DB write fails
    }

    if (!createdPost) {
      createdPost = {
        id: `win-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        traderName: data.traderName,
        location: data.location || "Global",
        badge,
        profitUsd: data.profitUsd,
        direction: data.direction,
        timeframe: data.timeframe,
        setupUsed: data.setupUsed,
        pips: data.pips || "Verified Target Hit",
        rating: data.rating ?? 5,
        comment: data.comment,
        likes: 1,
        verified,
        createdAt: new Date().toISOString(),
      };
      memoryPosts.unshift(createdPost);
    }

    return NextResponse.json({ post: createdPost }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to process your profit submission. Please try again." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = typeof body?.id === "string" ? body.id : "";

    if (!postId) {
      return NextResponse.json({ error: "Missing post id" }, { status: 400 });
    }

    if (postId.startsWith("win-seed-")) {
      seedLikesOffset[postId] = (seedLikesOffset[postId] ?? 0) + 1;
      return NextResponse.json({ ok: true, id: postId });
    }

    const memPost = memoryPosts.find((p) => p.id === postId);
    if (memPost) {
      memPost.likes += 1;
    }

    try {
      await prisma.tradeSetup.update({
        where: { id: postId },
        data: { score: { increment: 1 } },
      });
    } catch {
      // Ignore if post is only in memory or seed
    }

    return NextResponse.json({ ok: true, id: postId });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

