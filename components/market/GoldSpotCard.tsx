"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Clock3, Lock, Radio } from "lucide-react";
import type { MarketDataState } from "@/lib/market/types";
import { formatUsd } from "@/lib/market/terminal-model";
import {
  formatCompactUsd,
  formatRoughUsd,
  formatSignedPct,
  formatSignedUsd,
  roundShare,
} from "@/lib/market/format";
import { useMounted } from "@/hooks/useMounted";
import { useDelayedSnapshot } from "@/hooks/useDelayedSnapshot";
import { LiveUtcClock } from "@/components/market/LiveUtcClock";
import { BuyerSellerBar } from "@/components/market/BuyerSellerBar";

interface GoldSpotCardProps {
  market: MarketDataState;
  /** Pro members get exact, unthrottled figures; free users get rounded, delayed estimates. */
  isPro: boolean;
  className?: string;
}

const CONNECTION_LABEL: Record<MarketDataState["connectionMode"], { text: string; cls: string }> = {
  connecting: { text: "CONNECTING…", cls: "border-white/10 bg-white/[0.04] text-slate-300" },
  websocket: { text: "WS LIVE (<40ms)", cls: "border-bull-400/30 bg-bull-400/10 text-bull-300 shadow-[0_0_10px_rgba(52,211,153,0.2)]" },
  polling: { text: "REST SYNC (2s)", cls: "border-gold-400/30 bg-gold-400/10 text-gold-300" },
  error: { text: "OFFLINE", cls: "border-bear-400/30 bg-bear-400/10 text-bear-300" },
};

export function GoldSpotCard({ market, isPro, className }: GoldSpotCardProps) {
  const mounted = useMounted();

  const price = market.currentPrice;
  const open = market.stats24h?.openPrice ?? 0;
  const changeAbs = open > 0 ? price - open : null;
  const changePct = open > 0 ? (price - open) / open : null;
  const isUp = (changeAbs ?? 0) >= 0;
  const tickDirection = price > market.previousPrice ? "up" : price < market.previousPrice ? "down" : "flat";

  const liveBuyerShare = market.volumeDistribution?.bullRatio ?? 0.5;
  const liveVolumeUsd = (market.stats24h?.volume ?? 0) * price;

  // Free tier: delayed (60s) snapshots, rounded to aggregated estimates.
  const buyerShareSnapshot = useDelayedSnapshot(liveBuyerShare, isPro);
  const volumeSnapshot = useDelayedSnapshot(liveVolumeUsd, isPro);
  const buyerShare = isPro ? liveBuyerShare : roundShare(buyerShareSnapshot);
  const volumeLabel = isPro ? formatCompactUsd(liveVolumeUsd) : formatRoughUsd(volumeSnapshot);
  const conn = CONNECTION_LABEL[market.connectionMode] || CONNECTION_LABEL.connecting;

  return (
    <section
      aria-labelledby="gold-spot-heading"
      className={`card overflow-hidden p-6 sm:p-7 ${className ?? ""}`}
      id="gold-spot-card"
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-400/10 blur-3xl" />

      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-200 via-gold-400 to-gold-600 font-display text-sm font-extrabold text-ink-950 shadow-gold">
            Au
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="gold-spot-heading" className="text-base font-semibold">
                Gold Spot Price (XAU/USD)
              </h2>
              <span className="rounded bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold text-gold-300 border border-gold-400/20">
                1:1 PHYSICAL BULLION
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Streaming continuous 24/7 liquidity · Feed: {market.source || "XAU/USD Institutional Spot (Interbank / Bybit / Binance)"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${conn.cls}`}>
            <Radio className="h-3 w-3" />
            {conn.text}
          </span>
        </div>
      </header>

      {/* Price */}
      <div className="relative mt-6 flex flex-wrap items-end gap-x-4 gap-y-2">
        {mounted ? (
          <span
            key={price}
            id="gold-spot-price"
            className={`font-display text-5xl font-bold tracking-tight text-white tabular sm:text-6xl ${
              tickDirection === "up" ? "animate-flash-up" : tickDirection === "down" ? "animate-flash-down" : ""
            }`}
          >
            {formatUsd(price)}
          </span>
        ) : (
          <span className="skeleton block h-14 w-64" />
        )}
        {mounted && changeAbs !== null && (
          <span
            className={`mb-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold tabular ${
              isUp ? "bg-bull-400/10 text-bull-300" : "bg-bear-400/10 text-bear-300"
            }`}
          >
            {isUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            {formatSignedUsd(changeAbs)} ({formatSignedPct(changePct)})
            <span className="ml-1 font-normal text-slate-400">24h</span>
          </span>
        )}
      </div>

      <div className="relative mt-3 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-gold-300" />
          <LiveUtcClock id="gold-spot-timestamp" className="font-medium text-slate-300" />
        </div>
        <span className="text-[11px] text-slate-500">
          Binance 24/7 Sub-Second Matching Engine · 0-second Interbank Delay
        </span>
      </div>

      {/* Sentiment */}
      <div className="relative mt-7 space-y-3 border-t border-white/[0.06] pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Buyers vs. Sellers (Order Flow Ratio)</h3>
          {!isPro && (
            <span className="text-[11px] font-medium text-slate-500">Delayed estimate · updates every 60s</span>
          )}
        </div>
        {mounted ? <BuyerSellerBar buyerShare={buyerShare} id="gold-spot-ratio" /> : <div className="skeleton h-9 w-full" />}
      </div>

      {/* Stats */}
      <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="card-muted col-span-2 p-4 sm:col-span-1">
          <dt className="stat-label">Market Volume</dt>
          <dd className="mt-1 stat-value" id="gold-spot-volume">
            {mounted ? (
              <>
                {volumeLabel} <span className="text-sm font-medium text-slate-400">/ 24h</span>
              </>
            ) : (
              <span className="skeleton block h-7 w-28" />
            )}
          </dd>
        </div>
        <div className="card-muted p-4">
          <dt className="stat-label">24h High</dt>
          <dd className="mt-1 stat-value text-bull-300">
            {mounted ? formatUsd(market.stats24h?.highPrice) : <span className="skeleton block h-7 w-24" />}
          </dd>
        </div>
        <div className="card-muted p-4">
          <dt className="stat-label">24h Low</dt>
          <dd className="mt-1 stat-value text-bear-300">
            {mounted ? formatUsd(market.stats24h?.lowPrice) : <span className="skeleton block h-7 w-24" />}
          </dd>
        </div>
      </dl>

      {!isPro && (
        <Link
          href="#pricing"
          className="relative mt-5 flex items-center justify-between gap-3 rounded-xl border border-gold-300/20 bg-gold-300/[0.06] px-4 py-3 text-sm text-gold-100 transition hover:border-gold-300/40"
          id="gold-spot-upgrade-hint"
        >
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold-300" />
            Free plan shows rounded, delayed sentiment and volume.
          </span>
          <span className="font-semibold text-gold-300">Get real-time →</span>
        </Link>
      )}
    </section>
  );
}
