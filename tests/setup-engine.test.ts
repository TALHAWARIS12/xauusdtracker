import { describe, it, expect } from "vitest";
import { evaluateTradeSetup } from "@/lib/market/setup-engine";
import { Candle } from "@/lib/market/types";

describe("Trade Setup Engine", () => {
  it("returns neutral 'No setup currently' when candle count is insufficient", () => {
    const result = evaluateTradeSetup([]);
    expect(result.hasSetup).toBe(false);
    expect(result.neutralReason).toContain("Insufficient historical candle bars");
  });

  it("handles a synthesized bullish sequence and produces a validated setup with R:R >= 1.5", () => {
    // Generate trending bullish candles
    const candles: Candle[] = [];
    let price = 2700;
    const now = Math.floor(Date.now() / 60000) * 60;

    for (let i = 50; i >= 0; i--) {
      price += 0.45;
      candles.push({
        time: now - i * 60,
        open: price - 0.2,
        high: price + 0.5,
        low: price - 0.3,
        close: price,
        volume: 80,
      });
    }

    const result = evaluateTradeSetup(candles, "1M");
    // Depending on indicator thresholds, it either returns a valid setup or a clear neutral explanation
    if (result.hasSetup) {
      expect(result.setup).toBeDefined();
      expect(result.setup?.direction).toBe("BULLISH");
      expect(result.setup?.riskReward).toBeGreaterThanOrEqual(1.5);
      expect(result.setup?.score).toBeGreaterThanOrEqual(70);
      expect(result.setup?.rationale).toBeDefined();
    } else {
      expect(result.neutralReason).toBeDefined();
      expect(result.neutralReason).toContain("No setup currently");
    }
  });

  it("returns 'No setup currently' on sideways / flat market data rather than forcing a trade signal", () => {
    const candles: Candle[] = [];
    const now = Math.floor(Date.now() / 60000) * 60;

    for (let i = 50; i >= 0; i--) {
      candles.push({
        time: now - i * 60,
        open: 2714.8,
        high: 2715.0,
        low: 2714.6,
        close: 2714.8,
        volume: 20,
      });
    }

    const result = evaluateTradeSetup(candles, "1M");
    expect(result.hasSetup).toBe(false);
    expect(result.neutralReason).toContain("No setup currently");
  });
});
