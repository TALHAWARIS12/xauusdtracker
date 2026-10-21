import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { fetchHistoricalCandles } from "@/lib/market/historical";
import { evaluateTradeSetup } from "@/lib/market/setup-engine";

export async function GET() {
  try {
    const session = await auth();
    const isSubscribed = await getSubscriptionStatus(session?.user?.id);
    const candles = await fetchHistoricalCandles();
    const evaluation = evaluateTradeSetup(candles, "1M");

    // Retrieve recent stored setups from database
    const recentSetups = await prisma.tradeSetup.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // If active setup detected, optionally persist snapshot if none active
    if (evaluation.hasSetup && evaluation.setup) {
      const s = evaluation.setup;
      const latestDbSetup = recentSetups[0];
      const isRecent =
        latestDbSetup &&
        Date.now() - latestDbSetup.createdAt.getTime() < 300_000; // 5 min debounce

      if (!isRecent) {
        await prisma.tradeSetup.create({
          data: {
            symbol: s.symbol,
            timeframe: s.timeframe,
            direction: s.direction,
            entryMin: s.entryMin,
            entryMax: s.entryMax,
            stopLoss: s.stopLoss,
            takeProfit: s.takeProfit,
            riskReward: s.riskReward,
            score: s.score,
            rationale: s.rationale,
            status: "ACTIVE",
          },
        }).catch((err) => console.warn("Failed to persist trade setup snapshot:", err));
      }
    }

    // SERVER-ENFORCED PAYWALL SANITIZATION:
    // If not subscribed, mask exact trade setup numerical parameters
    if (!isSubscribed) {
      return NextResponse.json({
        isSubscribed: false,
        evaluation: {
          hasSetup: evaluation.hasSetup,
          neutralReason: evaluation.neutralReason,
          context: {
            trend: evaluation.context.trend,
            momentum: evaluation.context.momentum,
            volatilityRegime: evaluation.context.volatilityRegime,
            session: evaluation.context.session,
            // Conceal precise indicator parameters
            ema20: null,
            ema50: null,
            rsi: null,
            atr: null,
          },
          setup: evaluation.setup
            ? {
                symbol: evaluation.setup.symbol,
                timeframe: evaluation.setup.timeframe,
                direction: evaluation.setup.direction,
                score: evaluation.setup.score,
                // Mask proprietary trade boundaries
                entryMin: null,
                entryMax: null,
                stopLoss: null,
                takeProfit: null,
                riskReward: null,
                rationale: "Upgrade to Institutional Clearance to unlock full trade setup boundaries, dynamic invalidation triggers, and 0.618 Fib targets.",
                conditionsMet: evaluation.setup.conditionsMet,
                timestamp: evaluation.setup.timestamp,
              }
            : undefined,
        },
        recentSetups: recentSetups.map((s) => ({
          id: s.id,
          symbol: s.symbol,
          timeframe: s.timeframe,
          direction: s.direction,
          score: s.score,
          createdAt: s.createdAt,
          entryMin: null,
          entryMax: null,
          stopLoss: null,
          takeProfit: null,
        })),
      });
    }

    // Full unmasked payload for verified subscribers
    return NextResponse.json({
      isSubscribed: true,
      evaluation,
      recentSetups,
    });
  } catch (error) {
    console.error("Terminal analysis endpoint failure:", error);
    return NextResponse.json(
      { error: "Internal server error analyzing market telemetry." },
      { status: 500 }
    );
  }
}
