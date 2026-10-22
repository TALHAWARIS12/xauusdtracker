"use client";

import { TrendingUp, TrendingDown, Sparkles, Clock, AlertCircle } from "lucide-react";
import type { TradeSetupResult } from "@/lib/market/setup-engine";
import { PaywallGateOverlay } from "@/components/dashboard/PaywallGateOverlay";

interface TradeSetupCardProps {
  evaluation: TradeSetupResult | null;
  isSubscribed: boolean;
}

export function TradeSetupCard({ evaluation, isSubscribed }: TradeSetupCardProps) {
  if (!evaluation) {
    return (
      <div className="card p-8 animate-pulse text-center text-sm text-slate-400">
        Evaluating real-time trade signals…
      </div>
    );
  }

  const { hasSetup, setup, neutralReason } = evaluation;
  const activeSetup = setup;

  return (
    <section
      aria-label="Algorithmic Trade Signals"
      className="card relative flex flex-col overflow-hidden"
      id="trade-setup-card"
    >
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Rule-Based Trade Signals</h2>
            <p className="text-[11px] text-slate-400">Timeframe: {setup?.timeframe || "1M"} · Gold Order Flow</p>
          </div>
        </div>

        <span
          className={`badge ${
            hasSetup && activeSetup
              ? activeSetup.direction === "BULLISH"
                ? "bg-bull-400/10 text-bull-300 border border-bull-400/30"
                : "bg-bear-400/10 text-bear-300 border border-bear-400/30"
              : "bg-white/[0.04] text-slate-400 border border-white/10"
          }`}
        >
          {hasSetup && activeSetup
            ? `${activeSetup.direction} Signal Identified`
            : "Neutral · Consolidating"}
        </span>
      </header>

      {/* Main Signal Content */}
      <div className={`p-6 space-y-6 ${!isSubscribed ? "filter blur-[5px] select-none pointer-events-none" : ""}`}>
        {activeSetup && hasSetup ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                    activeSetup.direction === "BULLISH"
                      ? "bg-bull-400/10 border-bull-400/30 text-bull-300"
                      : "bg-bear-400/10 border-bear-400/30 text-bear-300"
                  }`}
                >
                  {activeSetup.direction === "BULLISH" ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : (
                    <TrendingDown className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold text-white">
                      {activeSetup.direction} Confluence Setup
                    </span>
                    <span className="badge-pro text-[10px] py-0.5">
                      Score: {activeSetup.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target Reward-to-Risk:{" "}
                    <strong className="text-gold-300 font-semibold">
                      {activeSetup.riskReward !== null ? `${activeSetup.riskReward}:1` : "—"}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5 sm:self-center">
                <Clock className="h-3.5 w-3.5 text-gold-300" />
                Updated {new Date(activeSetup.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
              </div>
            </div>

            {/* Target Boundaries */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card-muted p-3.5 text-center">
                <span className="text-[11px] font-medium text-slate-400 block">Entry Zone</span>
                <span className="mt-1 font-display text-sm sm:text-base font-bold text-white tabular block">
                  ${activeSetup.entryMin.toFixed(2)} - ${activeSetup.entryMax.toFixed(2)}
                </span>
              </div>
              <div className="card-muted p-3.5 text-center">
                <span className="text-[11px] font-medium text-bear-300 block">Stop-Loss (Invalidation)</span>
                <span className="mt-1 font-display text-sm sm:text-base font-bold text-bear-300 tabular block">
                  ${activeSetup.stopLoss.toFixed(2)}
                </span>
              </div>
              <div className="card-muted p-3.5 text-center">
                <span className="text-[11px] font-medium text-bull-300 block">Take-Profit Target</span>
                <span className="mt-1 font-display text-sm sm:text-base font-bold text-bull-300 tabular block">
                  ${activeSetup.takeProfit.toFixed(2)}
                </span>
              </div>
              <div className="card-muted p-3.5 text-center">
                <span className="text-[11px] font-medium text-gold-300 block">Reward / Risk</span>
                <span className="mt-1 font-display text-sm sm:text-base font-bold text-gold-300 tabular block">
                  {activeSetup.riskReward}:1
                </span>
              </div>
            </div>

            {/* Plain English Rationale */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <span className="text-xs font-semibold text-gold-300 uppercase tracking-wider block">
                Trade Analysis & System Rationale
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {activeSetup.rationale}
              </p>
              {activeSetup.conditionsMet && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {activeSetup.conditionsMet.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300"
                    >
                      ✓ {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 px-4 rounded-xl border border-white/[0.06] bg-white/[0.02] text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] text-slate-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white">No Active Signal Currently</h3>
            <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
              {neutralReason ||
                "Market is currently consolidating. Signals require strict EMA trend alignment, confirming RSI momentum, and at least a 1.5:1 reward-to-risk ratio before firing."}
            </p>
          </div>
        )}
      </div>

      {/* Freemium Paywall Gate Overlay */}
      {!isSubscribed && (
        <PaywallGateOverlay
          heading="Unlock Real-Time Institutional Order Flow"
          subtext="Subscribe to access zero-delay tick data, depth charts, and automated broker signals."
          buttonText="Choose Your Plan"
          pricingHref="/pricing"
        />
      )}
    </section>
  );
}
