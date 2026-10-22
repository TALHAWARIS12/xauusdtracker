"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Candle,
  ConnectionMode,
  LiveOrderBook,
  LiveOrderFlow,
  MarketDataState,
  OrderBookLevel,
  WebSocketStatus,
} from "@/lib/market/types";
import {
  ChartTimeframe,
  fetch24hStats,
  fetchHistoricalCandles,
  generateFallbackCandles,
} from "@/lib/market/historical";
import {
  calculateLiquidityZones,
  calculateSwingLevels,
  calculateVolumeDistribution,
} from "@/lib/market/liquidity-engine";

const BINANCE_FSTREAM_URL =
  "wss://fstream.binance.com/stream?streams=xauusdt@ticker/xauusdt@markPrice/xauusdt@depth10@100ms/xauusdt@aggTrade/xauusdt@kline_1m/xauusdt@kline_5m/xauusdt@kline_15m";
const BYBIT_WS_URL = "wss://stream.bybit.com/v5/public/linear";
const POLLING_INTERVAL_MS = 1500;
const STATS_REFRESH_MS = 20_000;
const MAX_CANDLES = 150;

// Benchmark seed initialized at ~$4,050 with zero mock ratios
const SEED_CANDLES = generateFallbackCandles(150, 4050.0);
const SEED_LATEST = SEED_CANDLES[SEED_CANDLES.length - 1];
const SEED_SWINGS = calculateSwingLevels(SEED_CANDLES);
const SEED_ZONES = calculateLiquidityZones(
  SEED_LATEST.close,
  SEED_SWINGS.swingHigh,
  SEED_SWINGS.swingLow
);
const SEED_VOLUME = calculateVolumeDistribution(SEED_CANDLES, null);

export function useMarketData(timeframe: ChartTimeframe = "1M"): MarketDataState {
  const [marketState, setMarketState] = useState<MarketDataState>({
    currentPrice: SEED_LATEST.close,
    previousPrice: SEED_LATEST.close,
    candles: SEED_CANDLES,
    latestCandle: SEED_LATEST,
    swingLevels: SEED_SWINGS,
    liquidityZones: SEED_ZONES,
    volumeDistribution: SEED_VOLUME,
    orderBook: null,
    orderFlow: null,
    stats24h: {
      openPrice: 4143.0,
      highPrice: 4151.0,
      lowPrice: 4043.0,
      volume: 148000,
    },
    connectionMode: "connecting",
    wsStatus: "Reconnecting",
    lastUpdated: Date.now(),
    error: null,
    isFallback: false,
    source: "Binance Futures 1:1 Live Engine (XAUUSDT)",
    latencyMs: 35,
    underlyingInstrument: "XAUUSDT (Perpetual / Spot Gold Bullion)",
    benchmarkAsset: "XAU/USD",
  });

  const wsRef = useRef<WebSocket | null>(null);
  const isWsConnectedRef = useRef<boolean>(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentTimeframeRef = useRef<ChartTimeframe>(timeframe);
  currentTimeframeRef.current = timeframe;

  // Real-time cumulative order flow delta accumulator (purges fake formulas)
  const orderFlowAccumRef = useRef<{
    buyVolume: number;
    sellVolume: number;
    tradesCount: number;
  }>({
    buyVolume: 0,
    sellVolume: 0,
    tradesCount: 0,
  });

  // In-memory cache for all timeframes so switching is instant
  const candlesByTfRef = useRef<Record<ChartTimeframe, Candle[]>>({
    "1M": SEED_CANDLES,
    "5M": [],
    "15M": [],
  });

  // Apply a new tick or candle to the active timeframe
  const applyMarketTick = useCallback(
    (newCandle: Candle, mode: ConnectionMode, sourceLabel?: string) => {
      if (
        !Number.isFinite(newCandle.close) ||
        newCandle.close <= 1000 ||
        newCandle.close >= 25000
      ) {
        return;
      }

      const activeTf = currentTimeframeRef.current;
      const currentList = candlesByTfRef.current[activeTf] || [];
      let nextList: Candle[];

      if (currentList.length === 0) {
        nextList = [newCandle];
      } else {
        const lastIndex = currentList.length - 1;
        const last = currentList[lastIndex];

        if (last.time === newCandle.time) {
          nextList = currentList.slice();
          nextList[lastIndex] = {
            ...newCandle,
            high: Math.max(last.high, newCandle.high),
            low: Math.min(last.low, newCandle.low),
          };
        } else if (newCandle.time > last.time) {
          nextList = [...currentList.slice(-(MAX_CANDLES - 1)), newCandle];
        } else {
          return;
        }
      }

      candlesByTfRef.current[activeTf] = nextList;

      const swingLevels = calculateSwingLevels(nextList);
      const liquidityZones = calculateLiquidityZones(
        newCandle.close,
        swingLevels.swingHigh,
        swingLevels.swingLow
      );

      setMarketState((prev) => {
        const volumeDistribution = calculateVolumeDistribution(nextList, prev.orderFlow);
        return {
          ...prev,
          currentPrice: newCandle.close,
          previousPrice: prev.currentPrice || newCandle.close,
          candles: nextList,
          latestCandle: newCandle,
          swingLevels,
          liquidityZones,
          volumeDistribution,
          connectionMode: mode,
          lastUpdated: Date.now(),
          error: null,
          isFallback: mode === "polling",
          source: sourceLabel || prev.source,
        };
      });
    },
    []
  );

  // Automated REST fallback query to initialize valid price & depth before/while WS connects
  const executeRestFallback = useCallback(async () => {
    let price: number | null = null;
    let high: number | null = null;
    let low: number | null = null;
    let open: number | null = null;
    let vol: number | null = null;

    // 1. Query Binance Futures REST endpoint
    try {
      const res = await fetch("https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=XAUUSDT", {
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        const p = parseFloat(data.lastPrice);
        if (Number.isFinite(p) && p > 1000) {
          price = p;
          open = parseFloat(data.openPrice);
          high = parseFloat(data.highPrice);
          low = parseFloat(data.lowPrice);
          vol = parseFloat(data.volume);
        }
      }
    } catch {}

    // 2. Query internal proxy endpoint if direct call timed out
    if (price === null) {
      try {
        const res = await fetch("/api/market/ticker", {
          cache: "no-store",
          signal: AbortSignal.timeout(2500),
        });
        if (res.ok) {
          const data = await res.json();
          if (Number.isFinite(data.price) && data.price > 1000) {
            price = data.price;
            if (data.stats24h) {
              open = data.stats24h.openPrice;
              high = data.stats24h.highPrice;
              low = data.stats24h.lowPrice;
              vol = data.stats24h.volume;
            }
          }
        }
      } catch {}
    }

    if (price !== null) {
      const activeTf = currentTimeframeRef.current;
      const currentCandles = candlesByTfRef.current[activeTf] || [];
      const last = currentCandles.length > 0 ? currentCandles[currentCandles.length - 1] : null;
      const intervalMinutes = activeTf === "15M" ? 15 : activeTf === "5M" ? 5 : 1;
      const stepSeconds = intervalMinutes * 60;
      const bucketTime = Math.floor(Date.now() / (stepSeconds * 1000)) * stepSeconds;

      let candle: Candle;
      if (last && last.time === bucketTime) {
        candle = {
          ...last,
          close: price,
          high: Number(Math.max(last.high, price).toFixed(2)),
          low: Number(Math.min(last.low, price).toFixed(2)),
        };
      } else {
        const o = last ? last.close : price;
        candle = {
          time: bucketTime,
          open: o,
          high: Number(Math.max(price, o).toFixed(2)),
          low: Number(Math.min(price, o).toFixed(2)),
          close: price,
          volume: 10,
        };
      }

      applyMarketTick(candle, "polling", "Binance Official REST Sync (XAUUSDT)");

      if (open && high && low) {
        setMarketState((prev) => ({
          ...prev,
          stats24h: {
            openPrice: open!,
            highPrice: high!,
            lowPrice: low!,
            volume: vol || prev.stats24h?.volume || 148000,
          },
        }));
      }
    }
  }, [applyMarketTick]);

  // REST polling fallback when WebSocket is offline/reconnecting
  const startRestPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;

    setMarketState((prev) => ({
      ...prev,
      connectionMode: "polling",
      wsStatus: "Reconnecting",
      isFallback: true,
      source: "Binance Official REST Sync (XAUUSDT)",
    }));

    void executeRestFallback();
    pollingIntervalRef.current = setInterval(executeRestFallback, POLLING_INTERVAL_MS);
  }, [executeRestFallback]);

  // Load historical candles whenever the active timeframe changes
  useEffect(() => {
    let cancelled = false;

    async function loadTimeframeData() {
      const cached = candlesByTfRef.current[timeframe];
      if (cached && cached.length >= 20) {
        const latest = cached[cached.length - 1];
        const swings = calculateSwingLevels(cached);
        const zones = calculateLiquidityZones(latest.close, swings.swingHigh, swings.swingLow);

        setMarketState((prev) => ({
          ...prev,
          candles: cached,
          latestCandle: latest,
          currentPrice: latest.close,
          swingLevels: swings,
          liquidityZones: zones,
          volumeDistribution: calculateVolumeDistribution(cached, prev.orderFlow),
        }));
      }

      try {
        const fresh = await fetchHistoricalCandles(timeframe, 150);
        if (cancelled || !fresh || fresh.length === 0) return;

        candlesByTfRef.current[timeframe] = fresh;
        const latest = fresh[fresh.length - 1];
        const swings = calculateSwingLevels(fresh);
        const zones = calculateLiquidityZones(latest.close, swings.swingHigh, swings.swingLow);

        setMarketState((prev) => ({
          ...prev,
          candles: fresh,
          latestCandle: latest,
          currentPrice: latest.close,
          swingLevels: swings,
          liquidityZones: zones,
          volumeDistribution: calculateVolumeDistribution(fresh, prev.orderFlow),
        }));
      } catch (err) {
        console.warn("Failed to load historical candles for timeframe", timeframe, err);
      }
    }

    void loadTimeframeData();

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  // Master Binance Futures WebSocket Lifecycle
  useEffect(() => {
    let cancelled = false;

    // Immediately trigger REST query to initialize valid price before WS connects
    void executeRestFallback();

    function connectWebSocket() {
      if (cancelled) return;

      try {
        setMarketState((prev) => ({ ...prev, wsStatus: "Reconnecting" }));
        const socket = new WebSocket(BINANCE_FSTREAM_URL);
        wsRef.current = socket;

        const connectTimer = setTimeout(() => {
          if (!isWsConnectedRef.current && !cancelled) {
            console.warn("Binance fstream timeout, activating automated REST fallback.");
            startRestPolling();
          }
        }, 3000);

        socket.onopen = () => {
          if (cancelled) {
            socket.close();
            return;
          }
          clearTimeout(connectTimer);
          isWsConnectedRef.current = true;

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          setMarketState((prev) => ({
            ...prev,
            connectionMode: "websocket",
            wsStatus: "Live Connected",
            isFallback: false,
            source: "Binance Futures WebSocket (XAUUSDT)",
            latencyMs: 25,
          }));
        };

        socket.onmessage = (event) => {
          if (cancelled) return;
          try {
            const payload = JSON.parse(event.data);
            const stream = payload.stream || "";
            const data = payload.data || payload;

            // 1. Ticker Stream (xauusdt@ticker): Real-time 24h metrics & Price
            if (stream.includes("ticker") || data.e === "24hrTicker") {
              const last = parseFloat(data.c);
              const open = parseFloat(data.o);
              const high = parseFloat(data.h);
              const low = parseFloat(data.l);
              const vol = parseFloat(data.v);
              const quoteVol = parseFloat(data.q);
              const pct = parseFloat(data.P);

              if (Number.isFinite(last) && last > 1000) {
                setMarketState((prev) => ({
                  ...prev,
                  currentPrice: last,
                  previousPrice: prev.currentPrice || last,
                  stats24h: {
                    openPrice: Number.isFinite(open) && open > 0 ? open : prev.stats24h?.openPrice || last,
                    highPrice: Number.isFinite(high) && high > 0 ? high : prev.stats24h?.highPrice || last,
                    lowPrice: Number.isFinite(low) && low > 0 ? low : prev.stats24h?.lowPrice || last,
                    volume: Number.isFinite(vol) ? vol : prev.stats24h?.volume || 0,
                    quoteVolume: quoteVol,
                    priceChangePercent: pct,
                  },
                  lastUpdated: Date.now(),
                  wsStatus: "Live Connected",
                }));
              }
            }

            // 2. Mark Price Stream (xauusdt@markPrice)
            if (stream.includes("markPrice") || data.e === "markPriceUpdate") {
              const mark = parseFloat(data.p);
              const index = parseFloat(data.i);
              if (Number.isFinite(mark) && mark > 1000) {
                setMarketState((prev) => ({
                  ...prev,
                  markPrice: mark,
                  indexPrice: Number.isFinite(index) ? index : prev.indexPrice,
                  wsStatus: "Live Connected",
                }));
              }
            }

            // 3. Partial Order Book Depth (xauusdt@depth10@100ms): 10 Real Bids & 10 Real Asks
            if (stream.includes("depth") || data.e === "depthUpdate") {
              const rawBids: [string, string][] = data.b || [];
              const rawAsks: [string, string][] = data.a || [];

              if (rawBids.length > 0 && rawAsks.length > 0) {
                let cumBid = 0;
                const bids: OrderBookLevel[] = rawBids.slice(0, 10).map(([p, q]) => {
                  const qty = parseFloat(q);
                  cumBid += qty;
                  return {
                    price: parseFloat(p),
                    qty,
                    total: Number(cumBid.toFixed(3)),
                  };
                });

                let cumAsk = 0;
                const asks: OrderBookLevel[] = rawAsks.slice(0, 10).map(([p, q]) => {
                  const qty = parseFloat(q);
                  cumAsk += qty;
                  return {
                    price: parseFloat(p),
                    qty,
                    total: Number(cumAsk.toFixed(3)),
                  };
                });

                const maxTotal = Math.max(cumBid, cumAsk, 1);
                bids.forEach((b) => (b.percent = Math.min(100, Math.round((b.total! / maxTotal) * 100))));
                asks.forEach((a) => (a.percent = Math.min(100, Math.round((a.total! / maxTotal) * 100))));

                const liveOrderBook: LiveOrderBook = {
                  bids,
                  asks,
                  lastUpdateId: data.u || data.lastUpdateId,
                  timestamp: Date.now(),
                };

                setMarketState((prev) => ({
                  ...prev,
                  orderBook: liveOrderBook,
                  wsStatus: "Live Connected",
                }));
              }
            }

            // 4. Aggregated Trades (xauusdt@aggTrade): Real-Time Order Flow Delta Calculation
            // Strict Spec Rule:
            // When m (is Buyer Maker) is true -> Classify as Sell-side Market Volume.
            // When m (is Buyer Maker) is false -> Classify as Buy-side Market Volume.
            if (
              stream.includes("aggTrade") ||
              stream.includes("trade") ||
              data.e === "aggTrade" ||
              data.e === "trade"
            ) {
              const tradePrice = parseFloat(data.p);
              const tradeQty = parseFloat(data.q);
              const isBuyerMaker = Boolean(data.m); // true = Maker was Buyer -> Taker was Seller (Sell-side Market Volume)
              const side: "BUY" | "SELL" = isBuyerMaker ? "SELL" : "BUY";

              if (Number.isFinite(tradeQty) && tradeQty > 0) {
                if (side === "BUY") {
                  orderFlowAccumRef.current.buyVolume += tradeQty;
                } else {
                  orderFlowAccumRef.current.sellVolume += tradeQty;
                }
                orderFlowAccumRef.current.tradesCount += 1;

                const bv = orderFlowAccumRef.current.buyVolume;
                const sv = orderFlowAccumRef.current.sellVolume;
                const totalV = bv + sv;
                const delta = bv - sv;

                const liveOrderFlow: LiveOrderFlow = {
                  buyVolume: Number(bv.toFixed(3)),
                  sellVolume: Number(sv.toFixed(3)),
                  totalVolume: Number(totalV.toFixed(3)),
                  delta: Number(delta.toFixed(3)),
                  buyRatio: totalV > 0 ? Number((bv / totalV).toFixed(4)) : 0.5,
                  sellRatio: totalV > 0 ? Number((sv / totalV).toFixed(4)) : 0.5,
                  recentTradesCount: orderFlowAccumRef.current.tradesCount,
                  lastTradeSide: side,
                  lastTradePrice: tradePrice,
                  lastTradeQty: tradeQty,
                };

                setMarketState((prev) => ({
                  ...prev,
                  orderFlow: liveOrderFlow,
                  volumeDistribution: calculateVolumeDistribution(prev.candles, liveOrderFlow),
                  wsStatus: "Live Connected",
                }));
              }
            }

            // 4. Kline Stream: Real-Time Candlestick Bar
            if (stream.includes("kline") || data.e === "kline") {
              const k = data.k;
              if (k) {
                const interval = k.i; // "1m", "5m", "15m"
                const activeTf = currentTimeframeRef.current;
                const tfMatch =
                  (activeTf === "1M" && interval === "1m") ||
                  (activeTf === "5M" && interval === "5m") ||
                  (activeTf === "15M" && interval === "15m");

                if (tfMatch) {
                  const candle: Candle = {
                    time: Math.floor(k.t / 1000),
                    open: parseFloat(k.o),
                    high: parseFloat(k.h),
                    low: parseFloat(k.l),
                    close: parseFloat(k.c),
                    volume: parseFloat(k.v) || 0,
                  };
                  applyMarketTick(candle, "websocket", "Binance Futures WebSocket (XAUUSDT)");
                }
              }
            }
          } catch {}
        };

        socket.onerror = () => {
          if (!cancelled && !isWsConnectedRef.current) {
            setMarketState((prev) => ({ ...prev, wsStatus: "Reconnecting" }));
            startRestPolling();
          }
        };

        socket.onclose = () => {
          isWsConnectedRef.current = false;
          if (!cancelled) {
            setMarketState((prev) => ({ ...prev, wsStatus: "Offline" }));
            startRestPolling();
            // Schedule auto-reconnect attempt
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
          }
        };
      } catch {
        if (!cancelled) {
          startRestPolling();
        }
      }
    }

    connectWebSocket();

    // Periodic 24h stats sync
    const statsInterval = setInterval(async () => {
      if (cancelled) return;
      try {
        const stats = await fetch24hStats();
        if (!cancelled && stats) {
          setMarketState((prev) => ({ ...prev, stats24h: stats }));
        }
      } catch {}
    }, STATS_REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(statsInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
        wsRef.current = null;
      }
    };
  }, [applyMarketTick, executeRestFallback, startRestPolling]);

  return marketState;
}
