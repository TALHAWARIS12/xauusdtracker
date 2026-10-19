import { Candle } from "./types";
import { evaluateMarketContext, MarketContextMetrics } from "./indicators";
import { calculateSwingLevels } from "./liquidity-engine";

export interface TradeSetupResult {
  hasSetup: boolean;
  neutralReason?: string;
  setup?: {
    symbol: "XAUUSD";
    timeframe: string;
    direction: "BULLISH" | "BEARISH";
    entryMin: number;
    entryMax: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
    score: number;
    rationale: string;
    conditionsMet: string[];
    timestamp: number;
  };
  context: MarketContextMetrics;
}

/**
 * Pure rule-based Trade Setup Engine.
 * Evaluates EMA trend, RSI momentum, ATR volatility, and volume distribution.
 * Returns either a strict, validated trade setup OR a transparent "No setup currently" response.
 */
export function evaluateTradeSetup(
  candles: Candle[],
  timeframe = "1M"
): TradeSetupResult {
  const context = evaluateMarketContext(candles);

  if (!candles || candles.length < 25) {
    return {
      hasSetup: false,
      neutralReason: "Insufficient historical candle bars to evaluate institutional setup criteria.",
      context,
    };
  }

  const latest = candles[candles.length - 1];
  const currentPrice = latest.close;
  const swings = calculateSwingLevels(candles);
  const atr = Math.max(context.atr, 1.0);

  // Bullish Rule Evaluation
  const isBullishTrend = context.trend === "BULLISH";
  const isRsiBullish = context.rsi >= 44 && context.rsi <= 68;
  const isAboveSwingLow = currentPrice > swings.swingLow;

  if (isBullishTrend && isRsiBullish && isAboveSwingLow) {
    const entryMin = Number((currentPrice - atr * 0.4).toFixed(2));
    const entryMax = Number((currentPrice + atr * 0.2).toFixed(2));
    const entryMid = (entryMin + entryMax) / 2;

    const stopLoss = Number((Math.min(swings.swingLow, entryMid - atr * 1.5)).toFixed(2));
    const risk = entryMid - stopLoss;

    if (risk > 0) {
      const targetDist = risk * 2.2;
      const takeProfit = Number((entryMid + targetDist).toFixed(2));
      const riskReward = Number((targetDist / risk).toFixed(2));

      if (riskReward >= 1.5) {
        const score = Math.min(95, Math.round(75 + (riskReward >= 2.0 ? 10 : 5) + (context.rsi >= 50 ? 5 : 0)));
        return {
          hasSetup: true,
          setup: {
            symbol: "XAUUSD",
            timeframe,
            direction: "BULLISH",
            entryMin,
            entryMax,
            stopLoss,
            takeProfit,
            riskReward,
            score,
            rationale: `Bullish EMA 20/50 alignment above swing demand level with healthy RSI momentum (${context.rsi.toFixed(1)}) and ${riskReward}:1 reward-to-risk expansion target.`,
            conditionsMet: [
              `EMA(20) > EMA(50) Bullish Trend Alignment`,
              `RSI(14) in Optimal Bullish Zone (${context.rsi.toFixed(1)})`,
              `Price Holding Above Structural Swing Low ($${swings.swingLow.toFixed(2)})`,
              `Favorable Reward-to-Risk Ratio (${riskReward}:1)`,
              `${context.session.description}`,
            ],
            timestamp: Date.now(),
          },
          context,
        };
      }
    }
  }

  // Bearish Rule Evaluation
  const isBearishTrend = context.trend === "BEARISH";
  const isRsiBearish = context.rsi <= 56 && context.rsi >= 32;
  const isBelowSwingHigh = currentPrice < swings.swingHigh;

  if (isBearishTrend && isRsiBearish && isBelowSwingHigh) {
    const entryMin = Number((currentPrice - atr * 0.2).toFixed(2));
    const entryMax = Number((currentPrice + atr * 0.4).toFixed(2));
    const entryMid = (entryMin + entryMax) / 2;

    const stopLoss = Number((Math.max(swings.swingHigh, entryMid + atr * 1.5)).toFixed(2));
    const risk = stopLoss - entryMid;

    if (risk > 0) {
      const targetDist = risk * 2.2;
      const takeProfit = Number((entryMid - targetDist).toFixed(2));
      const riskReward = Number((targetDist / risk).toFixed(2));

      if (riskReward >= 1.5) {
        const score = Math.min(95, Math.round(75 + (riskReward >= 2.0 ? 10 : 5) + (context.rsi <= 50 ? 5 : 0)));
        return {
          hasSetup: true,
          setup: {
            symbol: "XAUUSD",
            timeframe,
            direction: "BEARISH",
            entryMin,
            entryMax,
            stopLoss,
            takeProfit,
            riskReward,
            score,
            rationale: `Bearish EMA 20/50 breakdown below swing supply with confirming RSI momentum (${context.rsi.toFixed(1)}) and ${riskReward}:1 reward-to-risk target.`,
            conditionsMet: [
              `EMA(20) < EMA(50) Bearish Trend Alignment`,
              `RSI(14) in Optimal Bearish Expansion (${context.rsi.toFixed(1)})`,
              `Price Rejected at Structural Swing High ($${swings.swingHigh.toFixed(2)})`,
              `Favorable Reward-to-Risk Ratio (${riskReward}:1)`,
              `${context.session.description}`,
            ],
            timestamp: Date.now(),
          },
          context,
        };
      }
    }
  }

  // Conditions do not align: Show "No setup currently"
  return {
    hasSetup: false,
    neutralReason: `No setup currently. Market regime is ${context.trend} with RSI at ${context.rsi.toFixed(1)} and ATR at $${context.atr.toFixed(2)}. Technical rules require strict trend, momentum, and risk-reward alignment before triggering a signal.`,
    context,
  };
}
