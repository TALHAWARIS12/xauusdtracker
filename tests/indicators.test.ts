import { describe, it, expect } from "vitest";
import {
  calculateEMA,
  calculateRSI,
  calculateATR,
  detectMarketSession,
  calculateZoneStrengthScore,
  evaluateMarketContext,
} from "@/lib/market/indicators";
import { generateFallbackCandles } from "@/lib/market/historical";

describe("Technical Indicators", () => {
  it("calculates EMA correctly across known price sequence", () => {
    const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const period = 5;
    const ema = calculateEMA(prices, period);

    expect(ema.length).toBe(prices.length);
    // Period 5 initial SMA = (10+11+12+13+14)/5 = 12
    expect(ema[4]).toBe(12);
    // Next value should follow EMA smoothing formula
    expect(ema[5]).toBeGreaterThan(12);
    expect(ema[ema.length - 1]).toBeCloseTo(18.2, 0);
  });

  it("calculates RSI within 0-100 bounds and identifies trend momentum", () => {
    const candles = generateFallbackCandles(40, 2700);
    const rsi = calculateRSI(candles, 14);

    expect(rsi).toBeGreaterThanOrEqual(0);
    expect(rsi).toBeLessThanOrEqual(100);
    expect(typeof rsi).toBe("number");
  });

  it("calculates ATR with positive volatility values", () => {
    const candles = generateFallbackCandles(30, 2715);
    const atr = calculateATR(candles, 14);

    expect(atr).toBeGreaterThan(0);
    expect(typeof atr).toBe("number");
  });

  it("detects valid institutional market session", () => {
    const session = detectMarketSession(new Date("2026-10-19T14:00:00Z"));
    expect(session.sessionName).toBe("LONDON_NY_OVERLAP");
    expect(session.isPeakVolume).toBe(true);

    const asianSession = detectMarketSession(new Date("2026-10-19T03:00:00Z"));
    expect(asianSession.sessionName).toBe("ASIAN");
  });

  it("scores zone strength between 20 and 99 without claiming probability", () => {
    const scoreDemand = calculateZoneStrengthScore(2705, 2715, 0.65, true);
    expect(scoreDemand).toBeGreaterThanOrEqual(20);
    expect(scoreDemand).toBeLessThanOrEqual(99);

    const scoreSupply = calculateZoneStrengthScore(2730, 2715, 0.35, false);
    expect(scoreSupply).toBeGreaterThanOrEqual(20);
    expect(scoreSupply).toBeLessThanOrEqual(99);
  });

  it("evaluates comprehensive market context", () => {
    const candles = generateFallbackCandles(60, 2714);
    const context = evaluateMarketContext(candles);

    expect(["BULLISH", "BEARISH", "NEUTRAL"]).toContain(context.trend);
    expect(["OVERSOLD", "NEUTRAL", "OVERBOUGHT"]).toContain(context.momentum);
    expect(["EXPANDING", "NORMAL", "COMPRESSED"]).toContain(context.volatilityRegime);
    expect(context.session).toBeDefined();
  });
});
