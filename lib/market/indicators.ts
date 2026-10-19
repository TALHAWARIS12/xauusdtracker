import { Candle } from "./types";

/**
 * Calculates Exponential Moving Average (EMA) for a series of values.
 */
export function calculateEMA(values: number[], period: number): number[] {
  if (!values || values.length === 0 || period <= 0) return [];
  if (values.length < period) return values.slice();

  const k = 2 / (period + 1);
  const emaArray: number[] = new Array(values.length);

  // Initial SMA as the seed for EMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  let currentEma = sum / period;
  emaArray[period - 1] = Number(currentEma.toFixed(2));

  // Compute EMA for subsequent values
  for (let i = period; i < values.length; i++) {
    currentEma = values[i] * k + currentEma * (1 - k);
    emaArray[i] = Number(currentEma.toFixed(2));
  }

  // Backfill earlier values
  for (let i = 0; i < period - 1; i++) {
    emaArray[i] = values[i];
  }

  return emaArray;
}

/**
 * Calculates Relative Strength Index (RSI) using standard Wilder's smoothing.
 * Default period: 14.
 */
export function calculateRSI(candles: Candle[], period = 14): number {
  if (!candles || candles.length < period + 1) return 50.0;

  const closes = candles.map((c) => c.close);
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100.0;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return Number(rsi.toFixed(2));
}

/**
 * Calculates Average True Range (ATR).
 * Default period: 14.
 */
export function calculateATR(candles: Candle[], period = 14): number {
  if (!candles || candles.length < 2) return 1.5;

  const trueRanges: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trueRanges.push(tr);
  }

  if (trueRanges.length < period) {
    const sum = trueRanges.reduce((acc, v) => acc + v, 0);
    return Number((sum / (trueRanges.length || 1)).toFixed(2));
  }

  let currentAtr = trueRanges.slice(0, period).reduce((acc, v) => acc + v, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    currentAtr = (currentAtr * (period - 1) + trueRanges[i]) / period;
  }

  return Number(currentAtr.toFixed(2));
}

export interface MarketSessionInfo {
  sessionName: "ASIAN" | "LONDON" | "NEW_YORK" | "LONDON_NY_OVERLAP";
  isOpen: boolean;
  isPeakVolume: boolean;
  description: string;
}

/**
 * Detects the current active institutional forex / bullion trading session based on UTC hour.
 */
export function detectMarketSession(date: Date = new Date()): MarketSessionInfo {
  const utcHour = date.getUTCHours();

  // London / New York Overlap: 12:00 - 16:00 UTC (highest gold volume)
  if (utcHour >= 12 && utcHour < 16) {
    return {
      sessionName: "LONDON_NY_OVERLAP",
      isOpen: true,
      isPeakVolume: true,
      description: "London / New York Liquidity Overlap (Peak Volatility)",
    };
  }

  // New York Session: 12:00 - 21:00 UTC
  if (utcHour >= 16 && utcHour < 21) {
    return {
      sessionName: "NEW_YORK",
      isOpen: true,
      isPeakVolume: true,
      description: "New York COMEX Active Session",
    };
  }

  // London Session: 07:00 - 16:00 UTC
  if (utcHour >= 7 && utcHour < 12) {
    return {
      sessionName: "LONDON",
      isOpen: true,
      isPeakVolume: true,
      description: "London Bullion Market (LBMA) Primary Session",
    };
  }

  // Asian / Pacific Session: 22:00 - 07:00 UTC
  return {
    sessionName: "ASIAN",
    isOpen: true,
    isPeakVolume: false,
    description: "Tokyo / Hong Kong Asian Range Session",
  };
}

export interface MarketContextMetrics {
  ema20: number;
  ema50: number;
  rsi: number;
  atr: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  momentum: "OVERSOLD" | "NEUTRAL" | "OVERBOUGHT";
  volatilityRegime: "EXPANDING" | "NORMAL" | "COMPRESSED";
  session: MarketSessionInfo;
}

export function evaluateMarketContext(candles: Candle[]): MarketContextMetrics {
  const session = detectMarketSession();

  if (!candles || candles.length < 20) {
    return {
      ema20: 0,
      ema50: 0,
      rsi: 50,
      atr: 2.0,
      trend: "NEUTRAL",
      momentum: "NEUTRAL",
      volatilityRegime: "NORMAL",
      session,
    };
  }

  const closes = candles.map((c) => c.close);
  const ema20Arr = calculateEMA(closes, 20);
  const ema50Arr = calculateEMA(closes, 50);

  const ema20 = ema20Arr[ema20Arr.length - 1] || closes[closes.length - 1];
  const ema50 = ema50Arr[ema50Arr.length - 1] || ema20;

  const rsi = calculateRSI(candles, 14);
  const atr = calculateATR(candles, 14);

  let trend: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";
  if (ema20 > ema50 + 0.15) trend = "BULLISH";
  else if (ema20 < ema50 - 0.15) trend = "BEARISH";

  let momentum: "OVERSOLD" | "NEUTRAL" | "OVERBOUGHT" = "NEUTRAL";
  if (rsi <= 35) momentum = "OVERSOLD";
  else if (rsi >= 65) momentum = "OVERBOUGHT";

  let volatilityRegime: "EXPANDING" | "NORMAL" | "COMPRESSED" = "NORMAL";
  if (atr >= 4.0) volatilityRegime = "EXPANDING";
  else if (atr < 1.2) volatilityRegime = "COMPRESSED";

  return {
    ema20,
    ema50,
    rsi,
    atr,
    trend,
    momentum,
    volatilityRegime,
    session,
  };
}

/**
 * Calculates a 0-100 zone strength heuristic score based on structural price levels,
 * volume distribution support, and distance.
 */
export function calculateZoneStrengthScore(
  zoneMid: number,
  currentPrice: number,
  bullRatio: number,
  isDemandZone: boolean
): number {
  if (currentPrice <= 0 || zoneMid <= 0) return 50;

  const distancePct = Math.abs(zoneMid - currentPrice) / currentPrice;
  // Zones between 0.3% and 2.5% away carry optimal execution weight
  let proximityScore = 40;
  if (distancePct >= 0.003 && distancePct <= 0.02) {
    proximityScore = 50;
  } else if (distancePct < 0.003) {
    proximityScore = 35; // Near-at-market zone
  } else {
    proximityScore = Math.max(15, Math.round(50 - (distancePct - 0.02) * 1500));
  }

  // Volume alignment score (up to 50 points)
  let volumeAlignment = 25;
  if (isDemandZone) {
    volumeAlignment = Math.round(bullRatio * 50);
  } else {
    volumeAlignment = Math.round((1 - bullRatio) * 50);
  }

  const totalScore = Math.min(99, Math.max(20, proximityScore + volumeAlignment));
  return totalScore;
}
