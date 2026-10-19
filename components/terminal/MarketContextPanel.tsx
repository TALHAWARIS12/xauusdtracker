"use client";

import { Activity, Compass, Gauge, Zap } from "lucide-react";
import type { MarketContextMetrics } from "@/lib/market/indicators";

interface MarketContextPanelProps {
  context: MarketContextMetrics | null;
  isSubscribed: boolean;
}

export function MarketContextPanel({ context, isSubscribed }: MarketContextPanelProps) {
  if (!context) {
    return (
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 animate-pulse text-terminal-subtext text-xs">
        CALCULATING MARKET CONTEXT…
      </div>
    );
  }

  const { ema20, ema50, rsi, atr, trend, momentum, volatilityRegime, session } = context;

  const trendColor =
    trend === "BULLISH"
      ? "text-terminal-green"
      : trend === "BEARISH"
      ? "text-terminal-red"
      : "text-terminal-gold";

  const momentumColor =
    momentum === "OVERBOUGHT"
      ? "text-terminal-red"
      : momentum === "OVERSOLD"
      ? "text-terminal-green"
      : "text-gray-300";

  return (
    <section
      aria-label="Market context analysis"
      className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden"
    >
      <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card flex items-center justify-between">
        <h2 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider">
          <Compass className="w-4 h-4 text-terminal-gold" />
          MARKET CONTEXT // TECHNICAL REGIME
        </h2>
        <span className="text-[10px] text-terminal-subtext">M1 CONFLUENCE MATRIX</span>
      </header>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Trend Regime */}
        <div className="bg-terminal-card p-3 rounded border border-terminal-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-terminal-subtext">
            <span>TREND BIAS</span>
            <Activity className="w-3.5 h-3.5 text-terminal-gold" />
          </div>
          <div className={`text-base font-extrabold tracking-wide ${trendColor}`}>
            {trend}
          </div>
          <div className="text-[10px] text-terminal-subtext pt-1 border-t border-terminal-border/40">
            {isSubscribed ? (
              <span>EMA(20): ${ema20.toFixed(2)} · EMA(50): ${ema50.toFixed(2)}</span>
            ) : (
              <span>EMA Alignment: {trend}</span>
            )}
          </div>
        </div>

        {/* Momentum Regime */}
        <div className="bg-terminal-card p-3 rounded border border-terminal-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-terminal-subtext">
            <span>MOMENTUM (RSI 14)</span>
            <Gauge className="w-3.5 h-3.5 text-terminal-green" />
          </div>
          <div className="text-base font-extrabold tracking-wide text-white">
            {isSubscribed ? (
              <span className="tabular-nums">{rsi.toFixed(1)}</span>
            ) : (
              <span>ACTIVE</span>
            )}
            <span className={`ml-2 text-xs font-bold ${momentumColor}`}>
              ({momentum})
            </span>
          </div>
          <div className="text-[10px] text-terminal-subtext pt-1 border-t border-terminal-border/40">
            Oversold &lt;35 · Overbought &gt;65
          </div>
        </div>

        {/* Volatility Regime */}
        <div className="bg-terminal-card p-3 rounded border border-terminal-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-terminal-subtext">
            <span>VOLATILITY (ATR 14)</span>
            <Zap className="w-3.5 h-3.5 text-terminal-gold" />
          </div>
          <div className="text-base font-extrabold tracking-wide text-terminal-gold">
            {isSubscribed ? `$${atr.toFixed(2)} / BAR` : "EXPANDING"}
          </div>
          <div className="text-[10px] text-terminal-subtext pt-1 border-t border-terminal-border/40">
            Regime: <strong className="text-gray-200">{volatilityRegime}</strong>
          </div>
        </div>

        {/* Active Trading Session */}
        <div className="bg-terminal-card p-3 rounded border border-terminal-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-terminal-subtext">
            <span>ACTIVE BULLION SESSION</span>
            <span
              className={`w-2 h-2 rounded-full ${
                session.isPeakVolume ? "bg-terminal-green animate-ping" : "bg-terminal-gold"
              }`}
            />
          </div>
          <div className="text-sm font-extrabold text-white tracking-wide truncate">
            {session.sessionName.replace(/_/g, " ")}
          </div>
          <div className="text-[10px] text-terminal-subtext pt-1 border-t border-terminal-border/40 truncate">
            {session.description}
          </div>
        </div>
      </div>
    </section>
  );
}
