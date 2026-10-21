"use client";

import { Activity, Compass, Gauge, Zap } from "lucide-react";
import type { MarketContextMetrics } from "@/lib/market/indicators";

interface MarketContextPanelProps {
  context: MarketContextMetrics | null;
  isSubscribed: boolean;
}

const SESSION_LABEL: Record<MarketContextMetrics["session"]["sessionName"], string> = {
  ASIAN: "Asian Session",
  LONDON: "London Session",
  NEW_YORK: "New York Session",
  LONDON_NY_OVERLAP: "London / New York Overlap",
};

const toTitle = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function MarketContextPanel({ context, isSubscribed }: MarketContextPanelProps) {
  if (!context) {
    return <div className="card skeleton h-32" />;
  }

  const { ema20, ema50, rsi, atr, trend, momentum, volatilityRegime, session } = context;

  const trendTone =
    trend === "BULLISH" ? "text-bull-300" : trend === "BEARISH" ? "text-bear-300" : "text-gold-300";
  const momentumTone =
    momentum === "OVERBOUGHT" ? "text-bear-300" : momentum === "OVERSOLD" ? "text-bull-300" : "text-slate-300";

  const items = [
    {
      key: "trend",
      label: "Trend",
      icon: Activity,
      value: <span className={trendTone}>{toTitle(trend)}</span>,
      detail: isSubscribed
        ? `EMA 20: $${ema20.toFixed(2)} · EMA 50: $${ema50.toFixed(2)}`
        : "Based on 20/50 moving averages",
    },
    {
      key: "momentum",
      label: "Momentum",
      icon: Gauge,
      value: (
        <span className="flex items-baseline gap-2">
          {isSubscribed && <span className="tabular text-white">{rsi.toFixed(1)}</span>}
          <span className={`${isSubscribed ? "text-sm" : ""} ${momentumTone}`}>{toTitle(momentum)}</span>
        </span>
      ),
      detail: "RSI · oversold below 35, overbought above 65",
    },
    {
      key: "volatility",
      label: "Volatility",
      icon: Zap,
      value: <span className="text-gold-300">{toTitle(volatilityRegime)}</span>,
      detail: isSubscribed ? `Average range: $${atr.toFixed(2)} per candle` : "Average true range regime",
    },
    {
      key: "session",
      label: "Trading Session",
      icon: Compass,
      value: <span className="text-white">{SESSION_LABEL[session.sessionName]}</span>,
      detail: session.isPeakVolume ? "Peak liquidity hours" : "Lower liquidity hours",
    },
  ];

  return (
    <section aria-label="Market conditions" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ key, label, icon: Icon, value, detail }) => (
        <div key={key} className="card p-5 transition hover:border-white/10" id={`context-${key}`}>
          <div className="flex items-center justify-between">
            <span className="stat-label">{label}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-slate-300">
              <Icon className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-2 font-display text-xl font-semibold">{value}</div>
          <p className="mt-1.5 text-xs text-slate-500">{detail}</p>
        </div>
      ))}
    </section>
  );
}
