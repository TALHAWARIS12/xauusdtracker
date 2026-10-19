import { describe, it, expect } from "vitest";
import {
  calculateSwingLevels,
  calculateLiquidityZones,
  calculateVolumeDistribution,
} from "@/lib/market/liquidity-engine";
import { deriveTerminalModel } from "@/lib/market/terminal-model";
import { generateFallbackCandles } from "@/lib/market/historical";
import { MarketDataState } from "@/lib/market/types";

describe("Liquidity Engine & Paywall Model Sanitization", () => {
  const candles = generateFallbackCandles(40, 2715);
  const swings = calculateSwingLevels(candles);
  const zones = calculateLiquidityZones(2715, swings.swingHigh, swings.swingLow);
  const volumes = calculateVolumeDistribution(candles);

  const mockState: MarketDataState = {
    currentPrice: 2715.0,
    previousPrice: 2714.5,
    candles,
    latestCandle: candles[candles.length - 1],
    swingLevels: swings,
    liquidityZones: zones,
    volumeDistribution: volumes,
    stats24h: {
      openPrice: 2700,
      highPrice: 2730,
      lowPrice: 2695,
      volume: 50000,
    },
    connectionMode: "websocket",
    lastUpdated: Date.now(),
    error: null,
    isFallback: false,
  };

  it("calculates valid swing levels with positive range", () => {
    expect(swings.swingHigh).toBeGreaterThan(swings.swingLow);
    expect(swings.range).toBeCloseTo(swings.swingHigh - swings.swingLow, 1);
  });

  it("calculates liquidity zones and Fib 0.618 TP targets", () => {
    expect(zones.buyerSLZone.min).toBeLessThan(zones.buyerSLZone.max);
    expect(zones.sellerSLZone.min).toBeLessThan(zones.sellerSLZone.max);
    expect(zones.buyerTPZone).toBeGreaterThan(swings.swingHigh);
    expect(zones.sellerTPZone).toBeLessThan(swings.swingLow);
  });

  it("enforces pure paywall sanitization when user is NOT subscribed", () => {
    const unsubscribedModel = deriveTerminalModel(mockState, false);

    expect(unsubscribedModel.ready).toBe(true);
    // Chart price lines MUST be null
    expect(unsubscribedModel.lines).toBeNull();

    // Depth zones MUST be null
    for (const d of unsubscribedModel.depth) {
      expect(d.zone).toBeNull();
      expect(d.traders).toBeNull();
      expect(d.widthPct).toBe(0);
    }

    // Positions table values MUST be null
    for (const p of unsubscribedModel.positions) {
      expect(p.entry).toBeNull();
      expect(p.stopLoss).toBeNull();
      expect(p.takeProfit).toBeNull();
      expect(p.notionalBillion).toBeNull();
    }
  });

  it("reveals complete quantitative zones when user is SUBSCRIBED", () => {
    const subscribedModel = deriveTerminalModel(mockState, true);

    expect(subscribedModel.ready).toBe(true);
    expect(subscribedModel.lines).not.toBeNull();
    expect(subscribedModel.lines?.buyerTP).toBe(zones.buyerTPZone);

    for (const d of subscribedModel.depth) {
      expect(d.zone).not.toBeNull();
      expect(d.traders).toBeGreaterThan(0);
      expect(d.widthPct).toBeGreaterThan(0);
    }

    for (const p of subscribedModel.positions) {
      expect(p.entry).not.toBeNull();
      expect(p.stopLoss).not.toBeNull();
      expect(p.takeProfit).not.toBeNull();
      expect(p.notionalBillion).toBeGreaterThan(0);
    }
  });
});
