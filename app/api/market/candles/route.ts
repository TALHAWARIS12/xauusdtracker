import { NextRequest, NextResponse } from "next/server";
import { Candle } from "@/lib/market/types";

const BYBIT_INTERVAL_MAP: Record<string, string> = {
  "1M": "1",
  "5M": "5",
  "15M": "15",
};

const BINANCE_INTERVAL_MAP: Record<string, string> = {
  "1M": "1m",
  "5M": "5m",
  "15M": "15m",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const timeframe = (searchParams.get("timeframe") || "1M").toUpperCase();
  const limitParam = parseInt(searchParams.get("limit") || "150", 10);
  const limit = Math.min(Math.max(limitParam, 30), 200);

  // 1. Try Bybit XAUUSDT (Direct Institutional Spot/Index Track)
  const bybitInterval = BYBIT_INTERVAL_MAP[timeframe] || "1";
  const bybitUrl = `https://api.bybit.com/v5/market/kline?category=linear&symbol=XAUUSDT&interval=${bybitInterval}&limit=${limit}`;

  try {
    const res = await fetch(bybitUrl, {
      next: { revalidate: 3 }, // Cache for 3 seconds on edge
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.retCode === 0 && Array.isArray(data?.result?.list) && data.result.list.length > 0) {
        const candles: Candle[] = data.result.list
          .map((item: string[]) => ({
            time: Math.floor(Number(item[0]) / 1000),
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            volume: parseFloat(item[5]) || 0,
          }))
          .filter((c: Candle) => Number.isFinite(c.close) && c.close > 0)
          .sort((a: Candle, b: Candle) => a.time - b.time);

        if (candles.length > 0) {
          return NextResponse.json({
            candles,
            source: "Bybit Institutional Gold (XAUUSDT)",
            timeframe,
            count: candles.length,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Server API: Bybit klines unavailable, falling back to Binance...", err);
  }

  // 2. Try Binance PAXG/USDT (1:1 Physical Gold Bullion)
  const binanceInterval = BINANCE_INTERVAL_MAP[timeframe] || "1m";
  const binanceUrl = `https://data-api.binance.vision/api/v3/klines?symbol=PAXGUSDT&interval=${binanceInterval}&limit=${limit}`;

  try {
    const res = await fetch(binanceUrl, {
      next: { revalidate: 3 },
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

        if (candles.length > 0) {
          return NextResponse.json({
            candles,
            source: "Binance Bullion Engine (PAXG/USDT)",
            timeframe,
            count: candles.length,
          });
        }
      }
    }
  } catch (err) {
    console.warn("Server API: Binance klines unavailable:", err);
  }

  return NextResponse.json(
    { error: "Unable to retrieve real-time market candles from upstream providers" },
    { status: 502 }
  );
}
