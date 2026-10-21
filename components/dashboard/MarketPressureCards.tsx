"use client";

import { Users, Lock, BarChart3, ShieldCheck, Zap } from "lucide-react";
import { formatBillions, formatInt, formatPct, type SideSummary } from "@/lib/market/terminal-model";

interface MarketPressureCardsProps {
  buyers: SideSummary;
  sellers: SideSummary;
  isSubscribed: boolean;
  className?: string;
}

export function MarketPressureCards({
  buyers,
  sellers,
  isSubscribed,
  className = "",
}: MarketPressureCardsProps) {
  const buyerPct = Math.min(100, Math.max(0, buyers.share * 100));
  const sellerPct = Math.min(100, Math.max(0, sellers.share * 100));
  const totalNotionalBillion = Number(
    (buyers.notionalBillion + sellers.notionalBillion).toFixed(1)
  );

  return (
    <section
      aria-label="Institutional Order Flow & Volume Pressure"
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
            Market Participant Pressure & Volume Flow
          </span>
        </div>
        <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-gold-300" />
          <span>30-Bar Rolling Volume Window · Billions ($B) Model</span>
        </span>
      </div>

      {/* Grid of Two Pressure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* BUY-SIDE PRESSURE CARD */}
        <article
          className="card relative overflow-hidden p-5 transition-colors border-bull-400/20 bg-gradient-to-br from-bull-500/[0.04] via-transparent to-transparent hover:border-bull-400/40"
          id="buy-side-pressure-card"
        >
          {/* Subtle Green Ambient Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-bull-400/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bull-300">
              <Users className="h-4 w-4 text-bull-400" />
              Buy-Side Pressure
            </span>
            <span className="inline-flex items-center rounded-lg border border-bull-400/30 bg-bull-400/10 px-2 py-0.5 text-xs font-extrabold text-bull-300 tabular">
              {formatPct(buyers.share)}
            </span>
          </div>

          <div className="relative mt-3">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-bull-300 tabular">
              {isSubscribed ? (
                <>
                  {formatInt(buyers.traders)}
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    buyers (proxy units)
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 text-slate-400 text-2xl">
                  <Lock className="h-5 w-5 text-gold-300" />
                  <span>••••••••</span>
                  <span className="text-xs text-gold-300/80 font-normal">
                    (Pro Only)
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">Modelled Buy Volume</span>
            <span className="font-bold text-white tabular">
              {isSubscribed ? (
                <span className="text-bull-300 font-extrabold text-sm">
                  {formatBillions(buyers.notionalBillion)}
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <Lock className="h-3 w-3 text-slate-400" /> Locked
                </span>
              )}
            </span>
          </div>
        </article>

        {/* SELL-SIDE PRESSURE CARD */}
        <article
          className="card relative overflow-hidden p-5 transition-colors border-bear-400/20 bg-gradient-to-br from-bear-500/[0.04] via-transparent to-transparent hover:border-bear-400/40"
          id="sell-side-pressure-card"
        >
          {/* Subtle Red Ambient Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-bear-400/10 blur-2xl" />

          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bear-300">
              <Users className="h-4 w-4 text-bear-400" />
              Sell-Side Pressure
            </span>
            <span className="inline-flex items-center rounded-lg border border-bear-400/30 bg-bear-400/10 px-2 py-0.5 text-xs font-extrabold text-bear-300 tabular">
              {formatPct(sellers.share)}
            </span>
          </div>

          <div className="relative mt-3">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-bear-300 tabular">
              {isSubscribed ? (
                <>
                  {formatInt(sellers.traders)}
                  <span className="ml-2 text-xs font-medium text-slate-400">
                    sellers (proxy units)
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-2 text-slate-400 text-2xl">
                  <Lock className="h-5 w-5 text-gold-300" />
                  <span>••••••••</span>
                  <span className="text-xs text-gold-300/80 font-normal">
                    (Pro Only)
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="relative mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">Modelled Sell Volume</span>
            <span className="font-bold text-white tabular">
              {isSubscribed ? (
                <span className="text-bear-300 font-extrabold text-sm">
                  {formatBillions(sellers.notionalBillion)}
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

      {/* Delta Split Bar with Billions Capacity Indicator */}
      <div className="card p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between text-xs font-semibold tabular">
          <span className="text-bull-300 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-bull-400 shadow-[0_0_8px_#34D399]" />
            BUY DELTA {buyerPct.toFixed(1)}%
            {isSubscribed && (
              <span className="text-slate-400 text-[11px] font-normal">
                ({formatBillions(buyers.notionalBillion)})
              </span>
            )}
          </span>

          <span className="text-slate-400 text-[11px] hidden sm:inline tracking-wider">
            {isSubscribed
              ? `Total Market Depth: $${totalNotionalBillion}B Notional Capacity`
              : "Subscribe to view live billions volume & participant counts"}
          </span>

          <span className="text-bear-300 flex items-center gap-1.5">
            {isSubscribed && (
              <span className="text-slate-400 text-[11px] font-normal">
                ({formatBillions(sellers.notionalBillion)})
              </span>
            )}
            {sellerPct.toFixed(1)}% SELL DELTA
            <span className="h-2 w-2 rounded-full bg-bear-400 shadow-[0_0_8px_#FB7185]" />
          </span>
        </div>

        {/* Dual Progress Bar */}
        <div
          className="h-3 w-full rounded-full overflow-hidden flex bg-white/[0.05] p-0.5 border border-white/10"
          role="progressbar"
          aria-valuenow={Math.round(buyerPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Buyer vs Seller Volume Share"
        >
          <div
            className="h-full rounded-l-full bg-gradient-to-r from-bull-500 to-bull-300 transition-[width] duration-700 ease-out shadow-[0_0_12px_rgba(52,211,153,0.5)]"
            style={{ width: `${buyerPct}%` }}
          />
          <div
            className="h-full flex-1 rounded-r-full bg-gradient-to-r from-bear-300 to-bear-500 transition-[width] duration-700 ease-out shadow-[0_0_12px_rgba(251,113,133,0.5)]"
          />
        </div>

        {/* Transparent Methodology Caption */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-gold-300/80" />
            Institutional volume estimation normalized from 1:1 physical gold backing
          </span>
          <span className="tabular">
            Sub-second Binance WebSockets Telemetry
          </span>
        </div>
      </div>
    </section>
  );
}
