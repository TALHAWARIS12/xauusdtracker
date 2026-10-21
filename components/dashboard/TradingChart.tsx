"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  createChart,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/market/types";

type LineKey = "buyerTP" | "sellerSL" | "buyerSL" | "sellerTP";

export interface ChartPriceLines {
  buyerTP: number;
  sellerSL: number;
  buyerSL: number;
  sellerTP: number;
}

interface TradingChartProps {
  candles: Candle[];
  lines: ChartPriceLines | null;
  className?: string;
}

const LINE_STYLE: Record<LineKey, { color: string; title: string }> = {
  buyerTP: { color: "#34D399", title: "Buyer target" },
  sellerSL: { color: "#F2B93B", title: "Seller stops" },
  buyerSL: { color: "#FB7185", title: "Buyer stops" },
  sellerTP: { color: "#94A3B8", title: "Seller target" },
};
const LINE_KEYS: LineKey[] = ["buyerTP", "sellerSL", "buyerSL", "sellerTP"];

const toBar = (c: Candle): CandlestickData<UTCTimestamp> => ({
  time: c.time as UTCTimestamp,
  open: c.open,
  high: c.high,
  low: c.low,
  close: c.close,
});

export default function TradingChart({ candles, lines, className }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const priceLinesRef = useRef<{
    buyerTP?: IPriceLine;
    sellerSL?: IPriceLine;
    buyerSL?: IPriceLine;
    sellerTP?: IPriceLine;
  }>({});
  const lastBarTimeRef = useRef<number | null>(null);

  // 1) Create chart on mount
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth || 800,
      height: container.clientHeight || 450,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(0,0,0,0)" },
        textColor: "#94A3B8",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 6,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34D399",
      downColor: "#FB7185",
      borderVisible: false,
      wickUpColor: "#34D399",
      wickDownColor: "#FB7185",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        chart.applyOptions({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLinesRef.current = {};
      lastBarTimeRef.current = null;
    };
  }, []);

  // 2) Update data safely
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !candles || candles.length === 0) return;

    try {
      // Ensure strictly ascending unique timestamps
      const map = new Map<number, Candle>();
      for (const c of candles) {
        map.set(c.time, c);
      }
      const uniqueSorted = Array.from(map.values()).sort((a, b) => a.time - b.time);
      const last = uniqueSorted[uniqueSorted.length - 1];
      const lastTime = lastBarTimeRef.current;

      if (lastTime === null || last.time < lastTime) {
        series.setData(uniqueSorted.map(toBar));
        chartRef.current?.timeScale().fitContent();
      } else {
        series.update(toBar(last));
      }
      lastBarTimeRef.current = last.time;
    } catch (err) {
      console.warn("Chart data update error:", err);
    }
  }, [candles]);

  // 3) Price lines
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !lines) return;

    for (const key of LINE_KEYS) {
      const price = lines[key];
      if (!Number.isFinite(price) || price <= 0) continue;

      const existing = priceLinesRef.current[key];
      if (existing) {
        existing.applyOptions({ price });
      } else {
        priceLinesRef.current[key] = series.createPriceLine({
          price,
          color: LINE_STYLE[key].color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: LINE_STYLE[key].title,
        });
      }
    }
  }, [lines]);

  return <div ref={chartContainerRef} className={className ?? "w-full h-full min-h-[420px]"} />;
}
