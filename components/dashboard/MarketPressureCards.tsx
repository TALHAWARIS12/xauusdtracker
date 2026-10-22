"use client";

import { Users, Lock, BarChart3, Zap, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { formatPct, type SideSummary } from "@/lib/market/terminal-model";
import { LiveOrderFlow, Ticker24h } from "@/lib/market/types";

interface MarketPressureCardsProps {
  buyers: SideSummary;
  sellers: SideSummary;
  orderFlow?: LiveOrderFlow | null;
  stats24h?: Ticker24h | null;
  isSubscribed: boolean;
  className?: string;
}

export function MarketPressureCards({
  buyers,
  sellers,
  orderFlow,
  stats24h,
  isSubscribed,
  className = "",
}: MarketPressureCardsProps) {
  // Use authentic live order flow if streaming, otherwise fallback to candle-calculated ratios
  const buyRatio = orderFlow ? orderFlow.buyRatio : buyers.share;
  const sellRatio = orderFlow ? orderFlow.sellRatio : sellers.share;
  const buyPct = Math.min(100, Math.max(0, buyRatio * 100));
  const sellPct = Math.min(100, Math.max(0, sellRatio * 100));

  const buyVolFormatted = orderFlow
    ? orderFlow.buyVolume.toLocaleString(undefined, { maximumFractionDigits: 1 })
    : "—";
  const sellVolFormatted = orderFlow
    ? orderFlow.sellVolume.toLocaleString(undefined, { maximumFractionDigits: 1 })
    : "—";
  const delta = orderFlow ? orderFlow.delta : 0;
  const isNetBuying = delta >= 0;

  const quoteVolumeM =
    stats24h?.quoteVolume && stats24h.quoteVolume > 0
      ? (stats24h.quoteVolume / 1_000_000).toFixed(1)
      : null;

  return (
    <section
      aria-label="Binance Real-Time Order Flow & Volume Delta"
      className={`space-y-4 ${className}`}
      id="market-pressure-analytics"
    >
      {/* Header Eyebrow */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gold-400/10 text-gold-300">
            <BarChart3 className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white">
            Binance Futures Live Order Flow (XAUUSDT)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {orderFlow?.lastTradeSide && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tabular ${
                orderFlow.lastTradeSide === "BUY"
                  ? "bg-bull-400/10 text-bull-300 border border-bull-400/30"
                  : "bg-bear-400/10 text-bear-300 border border-bear-400/30"
              }`}
            >
              <Activity className="h-2.5 w-2.5 animate-pulse" />
              Last: {orderFlow.lastTradeSide} @ ${orderFlow.lastTradePrice?.toFixed(2)} (
              {orderFlow.lastTradeQty?.toFixed(2)} oz)
            </span>
          )}
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5 hidden sm:flex">
            <Zap className="h-3 w-3 text-gold-300" />
            <span>Real-Time aggTrade Volume Delta</span>
          </span>
        </div>
      </div>

      {/* Grid of Two Pressure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUY-SIDE MARKET VOLUME CARD */}
        <article
          className="card relative overflow-hidden p-5 transition-colors border-bull-400/20 bg-gradient-to-br from-bull-500/[0.04] via-transparent to-transparent hover:border-bull-400/40"
          id="buy-side-pressure-card"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-bull-400/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bull-300">
              <ArrowUpRight className="h-4 w-4 text-bull-400" />
              Buy-Side Market Flow
            </span>
            <span className="inline-flex items-center rounded-lg border border-bull-400/30 bg-bull-400/10 px-2 py-0.5 text-xs font-extrabold text-bull-300 tabular">
              {buyPct.toFixed(1)}%
            </span>
          </div>

          <div className="relative mt-3">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-bull-300 tabular">
              {isSubscribed ? (
                <>
                  {orderFlow ? buyVolFormatted : `${buyPct.toFixed(1)}%`}
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    {orderFlow ? "contracts / oz" : "share"}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 text-slate-400 text-2xl">
                  <Lock className="h-5 w-5 text-gold-300" />
                  <span>••••••••</span>
                  <span className="text-xs text-gold-300/80 font-normal">(Pro Only)</span>
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">Market Buy Orders (Taker)</span>
            <span className="font-bold text-white tabular">
              {isSubscribed ? (
                <span className="text-bull-300 font-extrabold text-xs">
                  {orderFlow ? `${orderFlow.recentTradesCount} live events` : "Streaming"}
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-slate-400" /> Locked
                </span>
              )}
            </span>
          </div>
        </article>

        {/* SELL-SIDE MARKET VOLUME CARD */}
        <article
          className="card relative overflow-hidden p-5 transition-colors border-bear-400/20 bg-gradient-to-br from-bear-500/[0.04] via-transparent to-transparent hover:border-bear-400/40"
          id="sell-side-pressure-card"
        >
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-bear-400/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bear-300">
              <ArrowDownRight className="h-4 w-4 text-bear-400" />
              Sell-Side Market Flow
            </span>
            <span className="inline-flex items-center rounded-lg border border-bear-400/30 bg-bear-400/10 px-2 py-0.5 text-xs font-extrabold text-bear-300 tabular">
              {sellPct.toFixed(1)}%
            </span>
          </div>

          <div className="relative mt-3">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-bear-300 tabular">
              {isSubscribed ? (
                <>
                  {orderFlow ? sellVolFormatted : `${sellPct.toFixed(1)}%`}
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    {orderFlow ? "contracts / oz" : "share"}
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 text-slate-400 text-2xl">
                  <Lock className="h-5 w-5 text-gold-300" />
                  <span>••••••••</span>
                  <span className="text-xs text-gold-300/80 font-normal">(Pro Only)</span>
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">Market Sell Orders (Taker)</span>
            <span className="font-bold text-white tabular">
              {isSubscribed ? (
                <span className="text-bear-300 font-extrabold text-xs">
                  {orderFlow ? `${orderFlow.recentTradesCount} live events` : "Streaming"}
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-slate-400" /> Locked
                </span>
              )}
            </span>
          </div>
        </article>
      </div>

      {/* Real-time Order Flow Delta Status Banner */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Cumulative Volume Delta:</span>
          <span
            className={`font-extrabold tabular px-2 py-0.5 rounded ${
              isNetBuying
                ? "bg-bull-400/10 text-bull-300 border border-bull-400/20"
                : "bg-bear-400/10 text-bear-300 border border-bear-400/20"
            }`}
          >
            {isNetBuying ? "+" : ""}
            {delta.toFixed(2)} oz ({isNetBuying ? "NET BUYING PRESSURE" : "NET SELLING PRESSURE"})
          </span>
        </div>

        {quoteVolumeM && (
          <div className="text-slate-400 tabular flex items-center gap-1.5">
            <span>24h Binance Futures Volume:</span>
            <span className="font-bold text-white">${quoteVolumeM}M USDT</span>
          </div>
        )}
      </div>
    </section>
  );
}
