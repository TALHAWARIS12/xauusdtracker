"use client";

import { TrendingUp, TrendingDown, ShieldAlert, Sparkles, AlertCircle, Clock } from "lucide-react";
import type { TradeSetupResult } from "@/lib/market/setup-engine";

interface TradeSetupCardProps {
  evaluation: TradeSetupResult | null;
  isSubscribed: boolean;
}

export function TradeSetupCard({ evaluation, isSubscribed }: TradeSetupCardProps) {
  if (!evaluation) {
    return (
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 animate-pulse min-h-[220px] flex items-center justify-center text-terminal-subtext text-xs">
        EVALUATING QUANTITATIVE SETUP RULES…
      </div>
    );
  }

  const { hasSetup, setup, neutralReason } = evaluation;

  return (
    <section
      aria-label="Algorithmic Trade Setup Engine"
      className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden flex flex-col justify-between"
    >
      <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-terminal-gold" />
          <h2 className="text-xs font-bold text-white tracking-wider">
            RULE-BASED SETUP ENGINE // {setup?.timeframe || "1M"}
          </h2>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
            hasSetup
              ? setup?.direction === "BULLISH"
                ? "bg-terminal-green/10 border-terminal-green/40 text-terminal-green"
                : "bg-terminal-red/10 border-terminal-red/40 text-terminal-red"
              : "bg-terminal-black border-terminal-border text-terminal-subtext"
          }`}
        >
          {hasSetup ? `${setup?.direction} SETUP IDENTIFIED` : "NEUTRAL // NO SETUP"}
        </span>
      </header>

      <div className="p-4 space-y-4">
        {hasSetup && setup ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border/60 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded border ${
                    setup.direction === "BULLISH"
                      ? "bg-terminal-green/10 border-terminal-green/30 text-terminal-green"
                      : "bg-terminal-red/10 border-terminal-red/30 text-terminal-red"
                  }`}
                >
                  {setup.direction === "BULLISH" ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm">
                      {setup.direction} ORDER FLOW SETUP
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-terminal-gold/20 text-terminal-gold border border-terminal-gold/40 font-bold">
                      SCORE: {setup.score}/100
                    </span>
                  </div>
                  <span className="text-[11px] text-terminal-subtext">
                    Timeframe: {setup.timeframe} · Target R:R: <strong className="text-terminal-gold">{setup.riskReward !== null ? `${setup.riskReward}:1` : "••••"}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px] text-terminal-subtext">
                <span className="flex items-center sm:justify-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Generated {new Date(setup.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} UTC
                </span>
              </div>
            </div>

            {/* Numerical Boundaries Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-terminal-card p-2.5 rounded border border-terminal-border">
                <span className="text-[10px] text-terminal-subtext block uppercase">EST. ENTRY ZONE</span>
                <span className="font-bold text-white tabular-nums">
                  {isSubscribed && setup.entryMin !== null
                    ? `$${setup.entryMin.toFixed(2)} - $${setup.entryMax.toFixed(2)}`
                    : "••••••••"}
                </span>
              </div>
              <div className="bg-terminal-card p-2.5 rounded border border-terminal-border">
                <span className="text-[10px] text-terminal-red block uppercase">STOP-LOSS (INVALIDATION)</span>
                <span className="font-bold text-terminal-red tabular-nums">
                  {isSubscribed && setup.stopLoss !== null ? `$${setup.stopLoss.toFixed(2)}` : "••••••••"}
                </span>
              </div>
              <div className="bg-terminal-card p-2.5 rounded border border-terminal-border">
                <span className="text-[10px] text-terminal-green block uppercase">TAKE-PROFIT TARGET</span>
                <span className="font-bold text-terminal-green tabular-nums">
                  {isSubscribed && setup.takeProfit !== null ? `$${setup.takeProfit.toFixed(2)}` : "••••••••"}
                </span>
              </div>
              <div className="bg-terminal-card p-2.5 rounded border border-terminal-border">
                <span className="text-[10px] text-terminal-gold block uppercase">REWARD / RISK</span>
                <span className="font-bold text-terminal-gold tabular-nums">
                  {isSubscribed && setup.riskReward !== null ? `${setup.riskReward}:1` : "••••"}
                </span>
              </div>
            </div>

            {/* Plain Language Rationale */}
            <div className="bg-terminal-black/70 border border-terminal-border/80 p-3 rounded space-y-1.5">
              <span className="text-[10px] font-bold text-terminal-gold tracking-wider uppercase block">
                WHY THIS SETUP? // SYSTEM RATIONALE:
              </span>
              <p className="text-xs text-gray-200 leading-relaxed">
                {setup.rationale}
              </p>
              {setup.conditionsMet && (
                <div className="pt-2 flex flex-wrap gap-1.5">
                  {setup.conditionsMet.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-terminal-card border border-terminal-border text-terminal-subtext"
                    >
                      ✓ {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Neutral State */
          <div className="py-6 px-4 bg-terminal-card/40 border border-terminal-border rounded text-center space-y-2">
            <div className="mx-auto w-10 h-10 rounded-full bg-terminal-black border border-terminal-border flex items-center justify-center text-terminal-subtext">
              <AlertCircle className="w-5 h-5 text-terminal-subtext" />
            </div>
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">
              NO SYSTEM SETUP CURRENTLY
            </h3>
            <p className="text-xs text-terminal-subtext max-w-lg mx-auto leading-relaxed">
              {neutralReason ||
                "Market is currently in consolidation or transitioning between volatility regimes. Technical rules require strict EMA trend direction, healthy RSI momentum, and a minimum 1.5:1 reward-to-risk ratio before triggering an institutional signal."}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-[10px] text-terminal-subtext/70 flex items-center gap-1.5 border-t border-terminal-border/40 pt-2">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-terminal-gold/70" />
          <span>
            Automated technical rules model. Not financial advice. No broker execution performed.
          </span>
        </div>
      </div>
    </section>
  );
}
