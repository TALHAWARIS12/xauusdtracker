"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { CandlestickChart, Crown, Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMarketData } from "@/hooks/useMarketData";
import { deriveTerminalModel } from "@/lib/market/terminal-model";
import { aggregateCandles } from "@/lib/market/historical";
import { evaluateTradeSetup } from "@/lib/market/setup-engine";
import { evaluateMarketContext } from "@/lib/market/indicators";
import { GoldSpotCard } from "@/components/market/GoldSpotCard";
import { MarketContextPanel } from "@/components/dashboard/MarketContextPanel";
import { OrderBookDepth } from "@/components/dashboard/OrderBookDepth";
import { TradeSetupCard } from "@/components/dashboard/TradeSetupCard";
import { RiskRewardCalculator } from "@/components/dashboard/RiskRewardCalculator";
import { MarketPressureCards } from "@/components/dashboard/MarketPressureCards";
import { PositionFlowTable } from "@/components/dashboard/PositionFlowTable";
import { PaymentSuccessModal } from "@/components/dashboard/PaymentSuccessModal";
import { PaywallGateOverlay } from "@/components/dashboard/PaywallGateOverlay";
import type { ChartPriceLines } from "@/components/dashboard/TradingChart";

const TradingChart = dynamic(() => import("@/components/dashboard/TradingChart"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[420px] w-full items-center justify-center text-sm text-slate-400">
      Loading interactive chart engine…
    </div>
  ),
});

interface DashboardClientProps {
  initialSubscribed: boolean;
  userEmail?: string | null;
}

type TimeframeOption = "1M" | "5M" | "15M";

export function DashboardClient({ initialSubscribed, userEmail }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const paymentParam = searchParams.get("payment");

  // Subscription state: initialize from props or local storage
  const [isSubscribed, setIsSubscribed] = useState<boolean>(initialSubscribed);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<TimeframeOption>("1M");

  const market = useMarketData(timeframe);

  // Check for payment=success or persistent sandbox_pro cookie/localStorage
  useEffect(() => {
    const isPaymentSuccess = paymentParam === "success";
    const localPro = typeof window !== "undefined" && localStorage.getItem("sandbox_pro") === "true";

    if (isPaymentSuccess) {
      setIsSubscribed(true);
      setShowSuccessModal(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("sandbox_pro", "true");
        document.cookie = "sandbox_pro=true; path=/; max-age=2592000; SameSite=Lax";
        // Clean URL query param so refresh doesn't loop modal
        window.history.replaceState({}, "", "/dashboard");
      }
    } else if (localPro && !isSubscribed) {
      setIsSubscribed(true);
      document.cookie = "sandbox_pro=true; path=/; max-age=2592000; SameSite=Lax";
    }
  }, [paymentParam, isSubscribed]);

  // Toggle sandbox mode for testing
  const handleToggleSandboxView = () => {
    const nextState = !isSubscribed;
    setIsSubscribed(nextState);
    if (typeof window !== "undefined") {
      if (nextState) {
        localStorage.setItem("sandbox_pro", "true");
        document.cookie = "sandbox_pro=true; path=/; max-age=2592000; SameSite=Lax";
      } else {
        localStorage.removeItem("sandbox_pro");
        document.cookie = "sandbox_pro=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
    }
  };

  // Active candles for selected timeframe (150 candles loaded directly per timeframe)
  const activeCandles = market.candles;

  // Derive model with data gating
  const model = useMemo(
    () => deriveTerminalModel(market, isSubscribed),
    [market, isSubscribed]
  );

  // Rule-based trade setup evaluation & market context
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

  return (
    <div className="container-app py-8 space-y-8">
      {/* Testing mode status pill & toggle banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isSubscribed
                ? "bg-gradient-to-r from-gold-300/20 to-gold-500/10 text-gold-200 border border-gold-300/30"
                : "bg-white/[0.06] text-slate-300 border border-white/10"
            }`}
          >
            {isSubscribed ? <Crown className="h-3.5 w-3.5 text-gold-300" /> : <EyeOff className="h-3.5 w-3.5" />}
            {isSubscribed ? "PRO ACTIVE (ALL FEATURES UNLOCKED)" : "FREEMIUM PREVIEW (GATED VIEW)"}
          </span>
          <span className="text-xs text-slate-400 hidden md:inline">
            {isSubscribed
              ? "Viewing unthrottled real-time order books, signals & depth charts."
              : "Detailed order book depth and signals are locked. Switch or subscribe to unlock."}
          </span>
        </div>

        {/* Sandbox switcher button */}
        <button
          type="button"
          onClick={handleToggleSandboxView}
          className="btn-secondary text-xs py-1.5 px-3 self-start sm:self-auto cursor-pointer"
          title="Toggle between Free and Pro views to test both states immediately"
          id="sandbox-view-toggle-btn"
        >
          {isSubscribed ? (
            <>
              <Eye className="h-3.5 w-3.5 text-slate-400" />
              <span>Preview Free Mode</span>
            </>
          ) : (
            <>
              <Crown className="h-3.5 w-3.5 text-gold-300" />
              <span>Quick Unlock Pro View</span>
            </>
          )}
        </button>
      </div>

      {/* Prominent Gold Spot Widget */}
      <GoldSpotCard market={market} isPro={isSubscribed} />

      {/* Restored Institutional Participant & Volume Flow Pressure Analytics */}
      <MarketPressureCards
        buyers={model.buyers}
        sellers={model.sellers}
        orderFlow={market.orderFlow}
        stats24h={market.stats24h}
        isSubscribed={isSubscribed}
      />

      {/* Market Context Panel */}
      <MarketContextPanel context={marketContext} isSubscribed={isSubscribed} />

      {/* Chart (2/3) + Order Book Depth (1/3) Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candlestick Chart */}
        <section
          aria-label="Gold Price Action Chart"
          className="card relative lg:col-span-2 flex flex-col overflow-hidden"
          id="candlestick-chart-section"
        >
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
                <CandlestickChart className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-semibold text-white">XAU/USD Candlestick Chart</h2>

              {/* Timeframe selector */}
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-1">
                {(["1M", "5M", "15M"] as TimeframeOption[]).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setTimeframe(tf)}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                      timeframe === tf
                        ? "bg-gold-400 text-ink-950 shadow-gold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              {isSubscribed ? (
                <span className="flex items-center gap-1.5 text-bull-300">
                  <span className="h-2 w-2 rounded-full bg-bull-400" />
                  Real-Time Targets Active
                </span>
              ) : (
                <span className="text-slate-400">Standard Candles</span>
              )}
            </div>
          </header>

          <div className="relative h-[420px] lg:h-[480px] p-2">
            <TradingChart candles={activeCandles} lines={lines} timeframe={timeframe} />
            {/* Free Mode Subtle Micro-Chart Paywall overlay */}
            {!isSubscribed && (
              <div className="absolute bottom-4 right-4 z-20">
                <div className="rounded-xl border border-gold-300/30 bg-ink-950/85 p-3.5 backdrop-blur-md shadow-glow max-w-xs space-y-1.5 text-xs">
                  <span className="font-semibold text-gold-300 flex items-center gap-1.5">
                    <Crown className="h-3.5 w-3.5" />
                    Proprietary Target Lines
                  </span>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Fibonacci 0.618 expansions & institutional stop hunts are hidden on the free plan.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Order Book Depth Panel (1/3) */}
        <div className="lg:col-span-1 min-h-[420px]">
          <OrderBookDepth
            rows={model.depth}
            currentPrice={market.currentPrice}
            isSubscribed={isSubscribed}
            orderBook={market.orderBook}
          />
        </div>
      </div>

      {/* Rule-Based Trade Setup Signals */}
      <TradeSetupCard evaluation={setupEvaluation} isSubscribed={isSubscribed} />

      {/* Risk / Reward & Position Sizing Calculator */}
      <RiskRewardCalculator currentPrice={market.currentPrice} />

      {/* Institutional Position Flow Breakdown Table */}
      <PositionFlowTable
        rows={model.positions}
        isSubscribed={isSubscribed}
        currentPrice={market.currentPrice}
      />

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
