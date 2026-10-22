import { describe, it, expect } from "vitest";
import {
  generateFallbackCandles,
  aggregateCandles,
} from "@/lib/market/historical";
import {
  calculateLiquidityZones,
  calculateSwingLevels,
  calculateVolumeDistribution,
} from "@/lib/market/liquidity-engine";
import { deriveTerminalModel } from "@/lib/market/terminal-model";
import type { Candle, MarketDataState } from "@/lib/market/types";

describe("Market Data Accuracy & Current Pricing Integrity (~$4,140 Gold Benchmark)", () => {
  it("generates realistic fallback candles aligned with current gold spot benchmark (~$4,140)", () => {
    const candles = generateFallbackCandles(100, 4140.0);
    expect(candles).toHaveLength(100);

    const latest = candles[candles.length - 1];
    expect(latest.close).toBeGreaterThan(4000);
    expect(latest.close).toBeLessThan(4300);

    // Verify candle structural validity
    for (const c of candles) {
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.high).toBeGreaterThanOrEqual(c.open);
      expect(c.high).toBeGreaterThanOrEqual(c.close);
      expect(c.low).toBeLessThanOrEqual(c.open);
      expect(c.low).toBeLessThanOrEqual(c.close);
      expect(c.volume).toBeGreaterThan(0);
      expect(c.time).toBeGreaterThan(0);
    }

    // Verify chronological ascending order
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].time).toBeGreaterThan(candles[i - 1].time);
    }
  });

  it("calculates accurate swing levels and liquidity zones around $4,140 market price", () => {
    const candles = generateFallbackCandles(30, 4140.0);
    const swings = calculateSwingLevels(candles);

    expect(swings.swingHigh).toBeGreaterThan(4100);
    expect(swings.swingLow).toBeLessThan(swings.swingHigh);
    expect(swings.range).toBe(Number((swings.swingHigh - swings.swingLow).toFixed(2)));

    const zones = calculateLiquidityZones(4140.0, swings.swingHigh, swings.swingLow);

    // Buyer SL should be below swingLow (0.995 to 0.998)
    expect(zones.buyerSLZone.min).toBeLessThan(swings.swingLow);
    expect(zones.buyerSLZone.max).toBeLessThan(swings.swingLow);
    expect(zones.buyerSLZone.min).toBeLessThan(zones.buyerSLZone.max);

    // Seller SL should be above swingHigh (1.002 to 1.005)
    expect(zones.sellerSLZone.min).toBeGreaterThan(swings.swingHigh);
    expect(zones.sellerSLZone.max).toBeGreaterThan(swings.swingHigh);

    // Fibonacci 0.618 extension targets
    const expectedBuyerTP = Number((swings.swingHigh + swings.range * 0.618).toFixed(2));
    const expectedSellerTP = Number((swings.swingLow - swings.range * 0.618).toFixed(2));
    expect(zones.buyerTPZone).toBe(expectedBuyerTP);
    expect(zones.sellerTPZone).toBe(expectedSellerTP);
  });

  it("models buyer vs. seller participant volume distribution on institutional billions ($B) scale", () => {
    const candles = generateFallbackCandles(30, 4140.0);
    const vol = calculateVolumeDistribution(candles);

    expect(vol.totalVolume).toBe(Number((vol.bullVolume + vol.bearVolume).toFixed(2)));
    expect(vol.bullRatio + vol.bearRatio).toBeCloseTo(1.0, 2);

    // Participant counts
    expect(vol.buyerHeadcount).toBeGreaterThan(0);
    expect(vol.sellerHeadcount).toBeGreaterThan(0);
    expect(Math.abs(vol.buyerHeadcount - 180000 * vol.bullRatio)).toBeLessThan(50);
    expect(Math.abs(vol.sellerHeadcount - 70000 * vol.bearRatio)).toBeLessThan(50);

    // Billions notional scale
    expect(vol.buySideNotionalBillion).toBe(Number((100.0 * vol.bullRatio).toFixed(2)));
    expect(vol.sellSideNotionalBillion).toBe(Number((50.0 * vol.bearRatio).toFixed(2)));
    expect(vol.buySideNotionalBillion).toBeGreaterThan(0);
    expect(vol.sellSideNotionalBillion).toBeGreaterThan(0);
  });

  it("aggregates candles correctly across 1M, 5M, and 15M timeframes", () => {
    const candles = generateFallbackCandles(60, 4140.0);
    const m5 = aggregateCandles(candles, 5);
    const m15 = aggregateCandles(candles, 15);

    expect(m5.length).toBeLessThanOrEqual(candles.length / 5 + 1);
    expect(m15.length).toBeLessThanOrEqual(candles.length / 15 + 1);

    // Timestamps of 5M bars must be multiples of 300 seconds
    for (const bar of m5) {
      expect(bar.time % 300).toBe(0);
    }

    // Timestamps of 15M bars must be multiples of 900 seconds
    for (const bar of m15) {
      expect(bar.time % 900).toBe(0);
    }
  });

  it("strictly enforces server-side paywall gating on proprietary analytics", () => {
    const candles = generateFallbackCandles(100, 4140.0);
    const latest = candles[candles.length - 1];
    const swings = calculateSwingLevels(candles);
    const zones = calculateLiquidityZones(latest.close, swings.swingHigh, swings.swingLow);
    const volume = calculateVolumeDistribution(candles);

    const mockState: MarketDataState = {
      currentPrice: latest.close,
      previousPrice: latest.close,
      candles,
      latestCandle: latest,
      swingLevels: swings,
      liquidityZones: zones,
      volumeDistribution: volume,
      stats24h: {
        openPrice: 4128.1,
        highPrice: 4148.5,
        lowPrice: 4115.5,
        volume: 2200,
      },
      connectionMode: "websocket",
      lastUpdated: Date.now(),
      error: null,
      isFallback: false,
    };

    // 1. FREE TIER: Proprietary targets and zones must be masked / null
    const freeModel = deriveTerminalModel(mockState, false);
    expect(freeModel.lines).toBeNull();
    for (const depth of freeModel.depth) {
      expect(depth.zone).toBeNull();
      expect(depth.traders).toBeNull();
    }
    for (const pos of freeModel.positions) {
      expect(pos.entry).toBeNull();
      expect(pos.stopLoss).toBeNull();
      expect(pos.takeProfit).toBeNull();
      expect(pos.notionalBillion).toBeNull();
    }

    // 2. SUBSCRIBER TIER: Proprietary targets and zones must be fully revealed
    const proModel = deriveTerminalModel(mockState, true);
    expect(proModel.lines).not.toBeNull();
    expect(proModel.lines?.buyerTP).toBe(zones.buyerTPZone);
    expect(proModel.lines?.sellerTP).toBe(zones.sellerTPZone);

    for (const depth of proModel.depth) {
      expect(depth.zone).not.toBeNull();
      expect(depth.traders).toBeGreaterThan(0);
    }
    for (const pos of proModel.positions) {
      expect(pos.entry).not.toBeNull();
      expect(pos.stopLoss).not.toBeNull();
      expect(pos.takeProfit).not.toBeNull();
      expect(pos.notionalBillion).toBeGreaterThan(0);
    }
  });

  it("fetches deep historical candles across 1M, 5M, and 15M timeframes (>= 100 bars for MT5 parity)", async () => {
    const { fetchHistoricalCandles } = await import("@/lib/market/historical");

    const m1Candles = await fetchHistoricalCandles("1M", 100);
    expect(m1Candles.length).toBeGreaterThanOrEqual(100);
    expect(m1Candles[m1Candles.length - 1].time).toBeGreaterThan(m1Candles[0].time);

    const m5Candles = await fetchHistoricalCandles("5M", 100);
    expect(m5Candles.length).toBeGreaterThanOrEqual(100);
    expect(m5Candles[m5Candles.length - 1].time).toBeGreaterThan(m5Candles[0].time);

    const m15Candles = await fetchHistoricalCandles("15M", 100);
    expect(m15Candles.length).toBeGreaterThanOrEqual(100);
    expect(m15Candles[m15Candles.length - 1].time).toBeGreaterThan(m15Candles[0].time);

    // Verify candle structural validity on 15M (matching MT5)
    for (const c of m15Candles) {
      expect(c.high).toBeGreaterThanOrEqual(c.low);
      expect(c.close).toBeGreaterThan(0);
      expect(c.open).toBeGreaterThan(0);
    }
  });
});
