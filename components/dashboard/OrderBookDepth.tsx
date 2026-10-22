"use client";

import { useState } from "react";
import { Layers, Activity, Lock, ArrowUp, ArrowDown } from "lucide-react";
import { formatInt, formatUsd, formatZone, type DepthRow } from "@/lib/market/terminal-model";
import { LiveOrderBook, OrderBookLevel } from "@/lib/market/types";
import { PaywallGateOverlay } from "@/components/dashboard/PaywallGateOverlay";

interface OrderBookDepthProps {
  rows: DepthRow[];
  currentPrice: number;
  isSubscribed: boolean;
  orderBook?: LiveOrderBook | null;
}

export function OrderBookDepth({
  rows,
  currentPrice,
  isSubscribed,
  orderBook,
}: OrderBookDepthProps) {
  const [viewTab, setViewTab] = useState<"book" | "clusters">("book");

  const cp = currentPrice > 1000 ? currentPrice : 4050.0;
  const bids = orderBook?.bids || [];
  const asks = orderBook?.asks || [];
  const hasLiveBook = bids.length > 0 && asks.length > 0;

  const bestBid = bids[0]?.price || cp;
  const bestAsk = asks[0]?.price || cp + 0.05;
  const spread = Math.max(0, bestAsk - bestBid);
  const spreadPct = (spread / (bestBid || 1)) * 100;

  return (
    <section
      aria-label="Binance Live Order Book Depth"
      className="card relative flex h-full flex-col overflow-hidden"
      id="order-book-depth-section"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Order Book Depth</h2>
            <p className="text-[11px] text-slate-400">Binance Futures (XAUUSDT)</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
          <button
            type="button"
            onClick={() => setViewTab("book")}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              viewTab === "book"
                ? "bg-gold-400 text-ink-950 shadow-gold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            L2 Depth (100ms)
          </button>
          <button
            type="button"
            onClick={() => setViewTab("clusters")}
            className={`rounded px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
              viewTab === "clusters"
                ? "bg-gold-400 text-ink-950 shadow-gold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Liquidity Zones
          </button>
        </div>
      </header>

      {/* Tab 1: Authentic Binance Futures L2 Order Book */}
      {viewTab === "book" && (
        <div className="flex-1 flex flex-col p-3 space-y-2 text-xs">
          {/* Column Header */}
          <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-white/[0.04]">
            <span>Price (USDT)</span>
            <span className="text-right">Size (Oz)</span>
            <span className="text-right">Total Depth</span>
          </div>

          {/* Asks (Sell Orders) - Rendered from highest to lowest ask */}
          <div className="space-y-0.5 flex flex-col-reverse min-h-[90px]">
            {hasLiveBook ? (
              asks.slice(0, isSubscribed ? 7 : 3).map((ask, idx) => (
                <DepthRowBar key={`ask-${idx}`} level={ask} type="ASK" />
              ))
            ) : (
              <div className="flex flex-col gap-1 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={`ask-skel-${i}`} className="h-5 rounded bg-bear-500/10 animate-pulse" />
                ))}
              </div>
            )}
          </div>

          {/* Real-time Spread & Mid Indicator */}
          <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 my-1">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-gold-300 animate-pulse" />
              <span className="text-sm font-extrabold text-white tabular">
                ${cp.toFixed(2)}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 tabular flex items-center gap-2">
              {hasLiveBook ? (
                <>
                  <span>Spread: ${spread.toFixed(2)}</span>
                  <span className="text-slate-500">({spreadPct.toFixed(3)}%)</span>
                </>
              ) : (
                <span className="text-gold-300/80">Awaiting Binance L2 Stream</span>
              )}
            </div>
          </div>

          {/* Bids (Buy Orders) - Rendered from highest to lowest bid */}
          <div className="space-y-0.5 min-h-[90px]">
            {hasLiveBook ? (
              bids.slice(0, isSubscribed ? 7 : 3).map((bid, idx) => (
                <DepthRowBar key={`bid-${idx}`} level={bid} type="BID" />
              ))
            ) : (
              <div className="flex flex-col gap-1 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={`bid-skel-${i}`} className="h-5 rounded bg-bull-500/10 animate-pulse" />
                ))}
              </div>
            )}
          </div>

          {/* Gated Preview for Free Tier */}
          {!isSubscribed && (
            <div className="pt-2 text-center border-t border-white/[0.06]">
              <span className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3 text-gold-300" />
                <span>Showing Top 3 Levels · Upgrade to Pro for Full 10-Level Depth</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Algorithmic Liquidity Clusters */}
      {viewTab === "clusters" && (
        <div
          className={`flex-1 p-4 space-y-3 ${
            !isSubscribed ? "filter blur-[4px] select-none pointer-events-none" : ""
          }`}
        >
          {rows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-semibold ${
                    row.tone === "green" ? "text-bull-300" : "text-bear-300"
                  }`}
                >
                  {row.label}
                </span>
                <span className="text-[11px] text-slate-400 tabular">
                  {row.zone ? formatZone(row.zone) : "••••••••"}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    row.tone === "green" ? "bg-bull-400" : "bg-bear-400"
                  }`}
                  style={{ width: `${Math.max(10, row.widthPct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paywall Overlay if in Clusters tab and unsubscribed */}
      {viewTab === "clusters" && !isSubscribed && (
        <PaywallGateOverlay
          heading="Unlock Full Institutional Clusters"
          subtext="Subscribe to reveal exact algorithmic Fibonacci target levels and stop-hunt pools."
          buttonText="Choose Your Plan"
          pricingHref="/pricing"
        />
      )}
    </section>
  );
}

function DepthRowBar({ level, type }: { level: OrderBookLevel; type: "BID" | "ASK" }) {
  const isBid = type === "BID";
  const textColor = isBid ? "text-bull-300" : "text-bear-300";
  const bgBarColor = isBid ? "bg-bull-500/15" : "bg-bear-500/15";

  return (
    <div className="relative flex items-center justify-between px-2 py-1 rounded overflow-hidden hover:bg-white/[0.02]">
      {/* Visual Depth Bar Fill */}
      <div
        className={`absolute top-0 bottom-0 ${isBid ? "left-0" : "right-0"} ${bgBarColor} transition-[width] duration-300`}
        style={{ width: `${Math.min(100, Math.max(5, level.percent || 20))}%` }}
      />
      <span className={`relative font-semibold tabular ${textColor}`}>
        {level.price.toFixed(2)}
      </span>
      <span className="relative text-right text-slate-300 tabular">
        {level.qty.toFixed(3)}
      </span>
      <span className="relative text-right text-slate-400 tabular">
        {level.total ? level.total.toFixed(3) : "—"}
      </span>
    </div>
  );
}
