import { Candle, Ticker24h } from "./types";

export type ChartTimeframe = "1M" | "5M" | "15M";

const BYBIT_INTERVAL: Record<ChartTimeframe, string> = {
  "1M": "1",
  "5M": "5",
  "15M": "15",
};

const BINANCE_INTERVAL: Record<ChartTimeframe, string> = {
  "1M": "1m",
  "5M": "5m",
  "15M": "15m",
};

const TIMEFRAME_MINUTES: Record<ChartTimeframe, number> = {
  "1M": 1,
  "5M": 5,
  "15M": 15,
};

type BinanceRawKline = [
  number, // 0: Open time (ms)
  string, // 1: Open
  string, // 2: High
  string, // 3: Low
  string, // 4: Close
  string, // 5: Volume
  number, // 6: Close time
  string, // 7: Quote asset volume
  number, // 8: Number of trades
  string, // 9: Taker buy base asset volume
  string, // 10: Taker buy quote asset volume
  string  // 11: Ignore
];

/**
 * Transforms raw Binance kline array into strictly-typed Candle array
 */
function parseBinanceKlines(raw: BinanceRawKline[]): Candle[] {
  if (!Array.isArray(raw)) {
    throw new Error("Invalid klines payload: expected array");
  }

  return raw.map((item) => {
    const openTimeMs = Number(item[0]);
    const open = parseFloat(item[1]);
    const high = parseFloat(item[2]);
    const low = parseFloat(item[3]);
    const close = parseFloat(item[4]);
    const volume = parseFloat(item[5]);

    return {
      time: Math.floor(openTimeMs / 1000), // UTC seconds
      open: isNaN(open) ? 0 : open,
      high: isNaN(high) ? 0 : high,
      low: isNaN(low) ? 0 : low,
      close: isNaN(close) ? 0 : close,
      volume: isNaN(volume) ? 0 : volume,
    };
  });
}

/**
 * Transforms Bybit linear kline array into strictly-typed Candle array (sorted ascending)
 */
function parseBybitKlines(list: string[][]): Candle[] {
  if (!Array.isArray(list)) {
    throw new Error("Invalid Bybit klines payload: expected array");
  }

  return list
    .map((item) => {
      const openTimeMs = Number(item[0]);
      const open = parseFloat(item[1]);
      const high = parseFloat(item[2]);
      const low = parseFloat(item[3]);
      const close = parseFloat(item[4]);
      const volume = parseFloat(item[5]);

      return {
        time: Math.floor(openTimeMs / 1000), // UTC seconds
        open: isNaN(open) ? 0 : open,
        high: isNaN(high) ? 0 : high,
        low: isNaN(low) ? 0 : low,
        close: isNaN(close) ? 0 : close,
        volume: isNaN(volume) ? 0 : volume,
      };
    })
    .filter((c) => c.close > 0)
    .sort((a, b) => a.time - b.time);
}

/**
 * Generates realistic synthetic historical candles around standard gold pricing
 * if both external exchange endpoints are blocked by the ISP or network firewall.
 */
export function generateFallbackCandles(
  count = 100,
  basePrice = 4060.0,
  intervalMinutes = 1
): Candle[] {
  const candles: Candle[] = [];
  const stepSeconds = (intervalMinutes || 1) * 60;
  const now = Math.floor(Date.now() / (stepSeconds * 1000)) * stepSeconds;
  let current = basePrice - 8.5;

  for (let i = count - 1; i >= 0; i--) {
    const time = now - i * stepSeconds;
    // Mean reversion + cyclical wave + bounded stochastic micro-structure
    const meanReversion = (basePrice - current) * 0.04;
    const wave = Math.sin(i / 8) * 1.4;
    const noise = (Math.random() - 0.49) * 2.0;
    const change = meanReversion + wave + noise;

    const open = Number(current.toFixed(2));
    const close = Number((open + change).toFixed(2));
    const wickHigh = Math.abs(Math.random() * 1.6);
    const wickLow = Math.abs(Math.random() * 1.6);
    const high = Number((Math.max(open, close) + wickHigh).toFixed(2));
    const low = Number((Math.min(open, close) - wickLow).toFixed(2));
    const volume = Number((25 + Math.random() * 75).toFixed(2));

    candles.push({ time, open, high, low, close, volume });
    current = close;
  }

  return candles;
}

/**
 * Aggregates 1-minute candles into higher timeframes (e.g., 5-minute or 15-minute bars).
 */
export function aggregateCandles(candles: Candle[], timeframeMinutes = 1): Candle[] {
  if (!candles || candles.length === 0 || timeframeMinutes <= 1) {
    return candles;
  }

  const intervalSeconds = timeframeMinutes * 60;
  const groups = new Map<number, Candle[]>();

  for (const c of candles) {
    const bucketTime = Math.floor(c.time / intervalSeconds) * intervalSeconds;
    const group = groups.get(bucketTime) || [];
    group.push(c);
    groups.set(bucketTime, group);
  }

  const aggregated: Candle[] = [];
  for (const [bucketTime, group] of groups.entries()) {
    group.sort((a, b) => a.time - b.time);
    const open = group[0].open;
    const close = group[group.length - 1].close;
    let high = -Infinity;
    let low = Infinity;
    let volume = 0;

    for (const c of group) {
      if (c.high > high) high = c.high;
      if (c.low < low) low = c.low;
      volume += c.volume;
    }

    aggregated.push({
      time: bucketTime,
      open,
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close,
      volume: Number(volume.toFixed(2)),
    });
  }

  return aggregated.sort((a, b) => a.time - b.time);
}

/**
 * Fetches historical candles for gold with multi-tier failover:
 * 1. Next.js internal API (/api/market/candles) if running in client browser
 * 2. Bybit XAUUSDT Linear Perpetual / Spot tracking institutional XAU/USD
 * 3. Binance Public Mirror / Primary PAXGUSDT (1:1 physical bullion)
 * 4. High-fidelity realistic fallback candles
 */
export async function fetchHistoricalCandles(
  timeframe: ChartTimeframe = "1M",
  limit = 150
): Promise<Candle[]> {
  const isBrowser = typeof window !== "undefined";
  const requestedLimit = Math.min(Math.max(limit, 30), 200);

  // Tier 1 (Client): Internal Proxy API
  if (isBrowser) {
    try {
      const res = await fetch(
        `/api/market/candles?timeframe=${timeframe}&limit=${requestedLimit}`,
        { cache: "no-store", signal: AbortSignal.timeout(3000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.candles) && data.candles.length >= 20) {
          return data.candles;
        }
      }
    } catch {
      // Continue to direct exchange fetch
    }
  }

  const binanceInterval = BINANCE_INTERVAL[timeframe] || "1m";

  // Tier 2: Binance Futures Official Klines (XAUUSDT)
  try {
    const fapiUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=XAUUSDT&interval=${binanceInterval}&limit=${requestedLimit}`;
    const res = await fetch(fapiUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const candles: Candle[] = data
          .map((item: (number | string)[]) => ({
            time: Math.floor(Number(item[0]) / 1000),
            open: parseFloat(String(item[1])),
            high: parseFloat(String(item[2])),
            low: parseFloat(String(item[3])),
            close: parseFloat(String(item[4])),
            volume: parseFloat(String(item[5])) || 0,
          }))
          .filter((c: Candle) => Number.isFinite(c.close) && c.close > 0)
          .sort((a: Candle, b: Candle) => a.time - b.time);

        if (candles.length > 0) return candles;
      }
    }
  } catch (fapiErr) {
    console.warn("Binance Futures klines unavailable, trying Bybit...", fapiErr);
  }

  // Tier 3: Bybit Direct XAUUSDT Linear Klines
  const bybitInterval = BYBIT_INTERVAL[timeframe] || "1";
  const bybitUrl = `https://api.bybit.com/v5/market/kline?category=linear&symbol=XAUUSDT&interval=${bybitInterval}&limit=${requestedLimit}`;

  try {
    const res = await fetch(bybitUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.retCode === 0 && Array.isArray(data?.result?.list)) {
        const candles = parseBybitKlines(data.result.list);
        if (candles.length > 0) return candles;
      }
    }
  } catch (bybitErr) {
    console.warn("Bybit API klines unavailable, trying Binance Vision mirror...", bybitErr);
  }

  // Tier 4: Binance PAXGUSDT (Public Vision Mirror)
  const mirrorBinanceUrl = `https://data-api.binance.vision/api/v3/klines?symbol=PAXGUSDT&interval=${binanceInterval}&limit=${requestedLimit}`;

  try {
    const res = await fetch(mirrorBinanceUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data: BinanceRawKline[] = await res.json();
      const candles = parseBinanceKlines(data);
      if (candles.length > 0) return candles;
    }
  } catch (mirrorErr) {
    console.warn("Binance Vision mirror unavailable, trying primary Binance API...", mirrorErr);
  }

  // Tier 4: Binance Primary API
  const primaryBinanceUrl = `https://api.binance.com/api/v3/klines?symbol=PAXGUSDT&interval=${binanceInterval}&limit=${requestedLimit}`;
  try {
    const res = await fetch(primaryBinanceUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data: BinanceRawKline[] = await res.json();
      const candles = parseBinanceKlines(data);
      if (candles.length > 0) return candles;
    }
  } catch {
    console.warn("All external market candle feeds unreachable; activating high-fidelity fallback model.");
  }

  // Tier 5: Fallback Candles
  return generateFallbackCandles(requestedLimit, 4060.0, TIMEFRAME_MINUTES[timeframe]);
}

/**
 * Fetches 24-hour high, low, open, volume stats for Gold
 */
export async function fetch24hStats(): Promise<Ticker24h> {
  const isBrowser = typeof window !== "undefined";

  // Tier 1 (Client): Internal Proxy API
  if (isBrowser) {
    try {
      const res = await fetch("/api/market/ticker", {
        cache: "no-store",
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.stats24h) {
          return data.stats24h;
        }
      }
    } catch {
      // Fall through to direct fetch
    }
  }

  // Tier 2: Binance Futures Official Ticker (XAUUSDT)
  try {
    const fapiRes = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=XAUUSDT", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (fapiRes.ok) {
      const data = await fapiRes.json();
      const open = parseFloat(data.openPrice);
      const high = parseFloat(data.highPrice);
      const low = parseFloat(data.lowPrice);
      const vol = parseFloat(data.volume);
      if (Number.isFinite(open) && open > 1000) {
        return {
          openPrice: open,
          highPrice: high,
          lowPrice: low,
          volume: vol,
        };
      }
    }
  } catch {}

  // Tier 3: TradingView Official CFD Scanner (OANDA:XAUUSD & TVC:GOLD)
  try {
    const tvRes = await fetch("https://scanner.tradingview.com/cfd/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbols: { tickers: ["OANDA:XAUUSD", "TVC:GOLD"] },
        columns: ["bid", "ask", "close", "open", "high", "low", "volume"],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    if (tvRes.ok) {
      const tvData = await tvRes.json();
      const row = tvData?.data?.[0]?.d;
      if (Array.isArray(row) && row.length >= 6) {
        const open = parseFloat(row[3]);
        const high = parseFloat(row[4]);
        const low = parseFloat(row[5]);
        const volume = parseFloat(row[6]) || 25000;
        if (Number.isFinite(open) && open > 1000) {
          return {
            openPrice: open,
            highPrice: high,
            lowPrice: low,
            volume,
          };
        }
      }
    }
  } catch {}

  // Tier 3: Bybit XAUUSDT Linear Ticker
  try {
    const res = await fetch(
      "https://api.bybit.com/v5/market/tickers?category=linear&symbol=XAUUSDT",
      { cache: "no-store", signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const data = await res.json();
      const t = data?.result?.list?.[0];
      if (t) {
        const last = parseFloat(t.lastPrice);
        const open = parseFloat(t.prevPrice24h) || last;
        const high = parseFloat(t.highPrice24h) || last;
        const low = parseFloat(t.lowPrice24h) || last;
        const vol = parseFloat(t.volume24h) || 0;
        if (Number.isFinite(last) && last > 1000) {
          return {
            openPrice: open,
            highPrice: high,
            lowPrice: low,
            volume: vol,
          };
        }
      }
    }
  } catch {}

  // Tier 3: Binance Vision Mirror
  try {
    const res = await fetch(
      "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=PAXGUSDT",
      { cache: "no-store", signal: AbortSignal.timeout(3000) }
    );
    if (res.ok) {
      const raw = await res.json();
      const openPrice = parseFloat(raw.openPrice);
      if (Number.isFinite(openPrice) && openPrice > 0) {
        return {
          openPrice,
          highPrice: parseFloat(raw.highPrice) || openPrice,
          lowPrice: parseFloat(raw.lowPrice) || openPrice,
          volume: parseFloat(raw.volume) || 0,
        };
      }
    }
  } catch {}

  // Tier 4: Fallback stats
  return {
    openPrice: 4085.0,
    highPrice: 4120.0,
    lowPrice: 4052.0,
    volume: 24500,
  };
}
