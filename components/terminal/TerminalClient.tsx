"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { CandlestickChart } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { deriveTerminalModel, formatUsd } from "@/lib/market/terminal-model";
import { MetricsHeader } from "@/components/terminal/MetricsHeader";
import { ConcentrationDepth } from "@/components/terminal/ConcentrationDepth";
import { PositionTable } from "@/components/terminal/PositionTable";
import { PaywallModal } from "@/components/terminal/PaywallModal";
import type { ChartPriceLines } from "@/components/terminal/TradingChart";

const TradingChart = dynamic(() => import("@/components/terminal/TradingChart"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[420px] flex items-center justify-center text-terminal-subtext text-xs animate-pulse">
      INITIALIZING CHART ENGINE…
    </div>
  ),
});

interface TerminalClientProps {
  isSubscribed: boolean;
  userEmail?: string | null;
}

export function TerminalClient({ isSubscribed }: TerminalClientProps) {
  const market = useMarketData();

  // Pure server-enforced paywall: sanitize model when not subscribed
  const model = useMemo(
    () => deriveTerminalModel(market, isSubscribed),
    [market, isSubscribed]
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
      <h1 className="sr-only">XAU/USD Liquidity Terminal</h1>

      {/* Top Metrics Cards Header (Public Real-Time Feed) */}
      <MetricsHeader
        price={market.currentPrice}
        previousPrice={market.previousPrice}
        change24h={model.change24h}
        buyers={model.buyers}
        sellers={model.sellers}
        connectionMode={market.connectionMode}
      />

      {/* Middle Grid: Candlestick Chart (2/3) + Concentration Depth Panel (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Candlestick Chart — Public live price action */}
        <section
          aria-label="Price chart"
          className="lg:col-span-2 bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden flex flex-col"
        >
          <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider">
              <CandlestickChart className="w-4 h-4 text-terminal-gold" />
              XAU/USD · 1M
            </h2>
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
          <div className="h-[420px] lg:h-[520px]">
            <TradingChart candles={market.candles} lines={lines} />
          </div>
        </section>

        {/* Concentration Depth Panel (1/3) */}
        <div className="lg:col-span-1 relative min-h-[380px]">
          <ConcentrationDepth
            rows={model.depth}
            currentPrice={market.currentPrice}
          />
          {/* Paywall Overlay over Depth Panel if not subscribed */}
          {!isSubscribed && <PaywallModal />}
        </div>
      </div>

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
