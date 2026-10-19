import { Candle, LiquidityZones, SwingLevels, VolumeDistribution } from "./types";

/**
 * Calculates Swing High and Swing Low over the last 15 candles.
 * Pure, deterministic calculation.
 */
export function calculateSwingLevels(candles: Candle[]): SwingLevels {
  if (!candles || candles.length === 0) {
    return { swingHigh: 0, swingLow: 0, range: 0 };
  }

  // Look back up to 15 candles
  const window = candles.slice(-15);

  let swingHigh = -Infinity;
  let swingLow = Infinity;

  for (const candle of window) {
    if (candle.high > swingHigh) swingHigh = candle.high;
    if (candle.low < swingLow) swingLow = candle.low;
  }

  if (swingHigh === -Infinity || swingLow === Infinity) {
    const fallbackPrice = candles[candles.length - 1]?.close || 0;
    return { swingHigh: fallbackPrice, swingLow: fallbackPrice, range: 0 };
  }

  return {
    swingHigh: Number(swingHigh.toFixed(2)),
    swingLow: Number(swingLow.toFixed(2)),
    range: Number((swingHigh - swingLow).toFixed(2)),
  };
}

/**
 * Calculates algorithmic Liquidity Zones (Stop Loss hunt clusters & Take Profit targets)
 * - Buyer SL Zone: range [swingLow * 0.995, swingLow * 0.998]
 * - Seller SL Zone: range [swingHigh * 1.002, swingHigh * 1.005]
 * - Buyer TP Zone: swingHigh + (swingHigh - swingLow) * 0.618
 * - Seller TP Zone: swingLow - (swingHigh - swingLow) * 0.618
 */
export function calculateLiquidityZones(
  currentPrice: number,
  swingHigh: number,
  swingLow: number
): LiquidityZones {
  const range = swingHigh - swingLow;

  const buyerSLMin = Number((swingLow * 0.995).toFixed(2));
  const buyerSLMax = Number((swingLow * 0.998).toFixed(2));

  const sellerSLMin = Number((swingHigh * 1.002).toFixed(2));
  const sellerSLMax = Number((swingHigh * 1.005).toFixed(2));

  const buyerTP = Number((swingHigh + range * 0.618).toFixed(2));
  const sellerTP = Number((swingLow - range * 0.618).toFixed(2));

  return {
    buyerSLZone: { min: buyerSLMin, max: buyerSLMax },
    sellerSLZone: { min: sellerSLMin, max: sellerSLMax },
    buyerTPZone: buyerTP,
    sellerTPZone: sellerTP,
  };
}

/**
 * Calculates Volume Distribution over the last 30 candles and derives
 * realistic retail headcounts and institutional notional positioning ($ billions).
 */
export function calculateVolumeDistribution(candles: Candle[]): VolumeDistribution {
  if (!candles || candles.length === 0) {
    return {
      bullVolume: 0,
      bearVolume: 0,
      totalVolume: 0,
      bullRatio: 0.5,
      bearRatio: 0.5,
      buyerHeadcount: 90000,
      sellerHeadcount: 35000,
      buySideNotionalBillion: 50.0,
      sellSideNotionalBillion: 25.0,
    };
  }

  // Window of last 30 candles
  const window = candles.slice(-30);

  let bullVolume = 0;
  let bearVolume = 0;

  for (const candle of window) {
    if (candle.close >= candle.open) {
      bullVolume += candle.volume;
    } else {
      bearVolume += candle.volume;
    }
  }

  const totalVolume = bullVolume + bearVolume;

  // Avoid division by zero
  const bullRatio = totalVolume > 0 ? bullVolume / totalVolume : 0.5;
  const bearRatio = totalVolume > 0 ? bearVolume / totalVolume : 0.5;

  // Headcount scaling
  const buyerHeadcount = Math.round(180000 * bullRatio);
  const sellerHeadcount = Math.round(70000 * bearRatio);

  // Notional scaling based on $100.0B buy and $50.0B sell limits
  const buySideNotionalBillion = Number((100.0 * bullRatio).toFixed(2));
  const sellSideNotionalBillion = Number((50.0 * bearRatio).toFixed(2));

  return {
    bullVolume: Number(bullVolume.toFixed(2)),
    bearVolume: Number(bearVolume.toFixed(2)),
    totalVolume: Number(totalVolume.toFixed(2)),
    bullRatio: Number(bullRatio.toFixed(4)),
    bearRatio: Number(bearRatio.toFixed(4)),
    buyerHeadcount,
    sellerHeadcount,
    buySideNotionalBillion,
    sellSideNotionalBillion,
  };
}
