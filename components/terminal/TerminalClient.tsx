"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { CandlestickChart } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { deriveTerminalModel, formatUsd } from "@/lib/market/terminal-model";
import { aggregateCandles } from "@/lib/market/historical";
import { evaluateTradeSetup } from "@/lib/market/setup-engine";
import { evaluateMarketContext } from "@/lib/market/indicators";
import { MetricsHeader } from "@/components/terminal/MetricsHeader";
import { ConcentrationDepth } from "@/components/terminal/ConcentrationDepth";
import { PositionTable } from "@/components/terminal/PositionTable";
import { PaywallModal } from "@/components/terminal/PaywallModal";
import { TradeSetupCard } from "@/components/terminal/TradeSetupCard";
import { MarketContextPanel } from "@/components/terminal/MarketContextPanel";
import { RiskRewardCalculator } from "@/components/terminal/RiskRewardCalculator";
import { StaleDataBanner } from "@/components/terminal/StaleDataBanner";
import type { ChartPriceLines } from "@/components/terminal/TradingChart";

const TradingChart = dynamic(() => import("@/components/terminal/TradingChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] flex items-center justify-center text-terminal-subtext text-xs animate-pulse font-mono">
      INITIALIZING CHART ENGINE…
    </div>
  ),
});

interface TerminalClientProps {
  isSubscribed: boolean;
  userEmail?: string | null;
}

type TimeframeOption = "1M" | "5M" | "15M";

export function TerminalClient({ isSubscribed }: TerminalClientProps) {
  const market = useMarketData();
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1M");

  // Multi-timeframe candle aggregation
  const timeframeMinutes = timeframe === "15M" ? 15 : timeframe === "5M" ? 5 : 1;
  const activeCandles = useMemo(
    () => aggregateCandles(market.candles, timeframeMinutes),
    [market.candles, timeframeMinutes]
  );

  // Pure server-enforced paywall: sanitize model when not subscribed
  const model = useMemo(
    () => deriveTerminalModel(market, isSubscribed),
    [market, isSubscribed]
  );

  // Rule-based Trade Setup evaluation & Market Context
  const setupEvaluation = useMemo(
    () => evaluateTradeSetup(activeCandles, timeframe),
    [activeCandles, timeframe]
  );

  const marketContext = useMemo(
    () => evaluateMarketContext(activeCandles),
    [activeCandles]
  );

  const l = model.lines;
  const lines = useMemo<ChartPriceLines | null>(
    () =>
      isSubscribed && l
        ? {
            buyerTP: l.buyerTP,
            sellerSL: l.sellerSL,
            buyerSL: l.buyerSL,
            sellerTP: l.sellerTP,
          }
        : null,
    [isSubscribed, l]
  );

  const bar = market.latestCandle;

  return (
    <div className="flex-1 w-full max-w-[1600px] mx-auto p-3 sm:p-4 lg:p-6 space-y-4 font-mono select-none">
      <h1 className="sr-only">XAU/USD Institutional Intelligence Terminal</h1>

      {/* Stale / Fallback Data Banner */}
      <StaleDataBanner
        connectionMode={market.connectionMode}
        isFallback={market.isFallback}
        lastUpdated={market.lastUpdated}
      />

      {/* Top Metrics Cards Header (Live / Estimated Volume Proxy) */}
      <MetricsHeader
        price={market.currentPrice}
        previousPrice={market.previousPrice}
        change24h={model.change24h}
        buyers={model.buyers}
        sellers={model.sellers}
        connectionMode={market.connectionMode}
        lastUpdated={market.lastUpdated}
      />

      {/* Market Context Panel (Trend, Momentum, Volatility, Session) */}
      <MarketContextPanel
        context={marketContext}
        isSubscribed={isSubscribed}
      />

      {/* Middle Grid: Candlestick Chart (2/3) + Concentration Depth Panel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Candlestick Chart — Live price action with timeframe tabs */}
        <section
          aria-label="Price chart"
          className="lg:col-span-2 bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden flex flex-col"
        >
          <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider">
                <CandlestickChart className="w-4 h-4 text-terminal-gold" />
                XAU/USD · SPOT GOLD
              </h2>

              {/* Timeframe Selector Tabs */}
              <div className="flex items-center gap-1 bg-terminal-black/70 p-0.5 rounded border border-terminal-border">
                {(["1M", "5M", "15M"] as TimeframeOption[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold transition cursor-pointer ${
                      timeframe === tf
                        ? "bg-terminal-gold text-terminal-black shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                        : "text-terminal-subtext hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {bar && (
              <div className="flex gap-3 text-[10px] tabular-nums text-terminal-subtext">
                <span>
                  O <span className="text-gray-200">{formatUsd(bar.open)}</span>
                </span>
                <span>
                  H <span className="text-terminal-green">{formatUsd(bar.high)}</span>
                </span>
                <span>
                  L <span className="text-terminal-red">{formatUsd(bar.low)}</span>
                </span>
                <span>
                  C <span className="text-white font-bold">{formatUsd(bar.close)}</span>
                </span>
              </div>
            )}
          </header>
          <div className="h-[420px] lg:h-[500px]">
            <TradingChart candles={activeCandles} lines={lines} />
          </div>
        </section>

        {/* Concentration Depth Panel (1/3) */}
        <div className="lg:col-span-1 relative min-h-[420px]">
          <ConcentrationDepth
            rows={model.depth}
            currentPrice={market.currentPrice}
          />
          {/* Paywall Overlay over Depth Panel if not subscribed */}
          {!isSubscribed && <PaywallModal />}
        </div>
      </div>

      {/* Rule-Based Trade Setup Engine Card */}
      <TradeSetupCard
        evaluation={setupEvaluation}
        isSubscribed={isSubscribed}
      />

      {/* Interactive Risk / Reward & Position Sizing Calculator */}
      <RiskRewardCalculator currentPrice={market.currentPrice} />

      {/* Bottom: Position Breakdown Table */}
      <div className="relative">
        <PositionTable rows={model.positions} />
        {/* Subtle blur overlay over Position Table if not subscribed */}
        {!isSubscribed && (
          <div className="absolute inset-0 bg-terminal-black/60 backdrop-blur-[2px] rounded-lg flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-terminal-gold tracking-widest uppercase bg-terminal-surface px-4 py-1.5 rounded border border-terminal-gold/40 shadow-lg">
              PROPRIETARY LIQUIDATION ZONES LOCKED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
