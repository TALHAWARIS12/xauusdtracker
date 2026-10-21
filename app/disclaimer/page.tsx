import { AlertTriangle, ShieldCheck, Scale } from "lucide-react";
import Link from "next/link";

export default function DisclaimerPage() {
  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 select-none">
      {/* Header */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 flex items-center gap-3.5">
        <div className="p-2.5 bg-terminal-card border border-terminal-red/40 rounded-lg text-terminal-red">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-white text-base tracking-wider uppercase">
            RISK DISCLOSURE & MARKET INFORMATION NOTICE
          </h1>
          <p className="text-terminal-subtext text-xs mt-0.5">
            XAUUSD Intelligence Platform · Version 1.0 Compliance Specification
          </p>
        </div>
      </div>

      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 space-y-6 text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-terminal-gold" />
            1. INFORMATIONAL AND RESEARCH PURPOSES ONLY
          </h2>
          <p>
            XAUUSD Intelligence provides market data normalization, algorithmic technical indicators, and quantitative structural estimates strictly for educational, research, and informational purposes. The platform does not provide individualized financial, investment, or trading advice, nor does it recommend buying, selling, or holding physical gold, gold CFD derivatives, futures, or any financial instrument.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-terminal-gold" />
            2. ESTIMATED NATURE OF LIQUIDITY & STOP-LOSS/TAKE-PROFIT ZONES
          </h2>
          <p>
            Unless explicitly noted and backed by a verified, licensed central exchange data feed, aggregate market-wide trader headcounts, retail order books, and exact stop-loss or take-profit orders cannot be observed across the decentralized over-the-counter (OTC) spot gold market.
          </p>
          <p className="bg-terminal-card border border-terminal-border p-3 rounded text-terminal-subtext">
            All stop-loss hunt zones, take-profit expansion levels, buyer/seller headcounts, and notional positioning figures displayed in this application are <strong>modelled mathematical estimates</strong> derived from historical price action, swing highs/lows, volatility bands (ATR), and volume distribution algorithms. They must not be construed as verified broker order books or actual participant counts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">3. NO GUARANTEED RETURNS OR WIN RATES</h2>
          <p>
            Past performance and algorithmic setup scores do not guarantee future profitability. Trade setup scores are heuristic alignment metrics derived from rules-based criteria (EMA trend alignment, RSI momentum bands, and risk-reward minimums) and must not be interpreted as statistical probabilities of market success.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">4. MARKET DATA FEEDS & LATENCY</h2>
          <p>
            Spot price quotes and historical candles are normalized from physical gold tokenized feeds (PAXG/USDT backed 1:1 by London Good Delivery physical troy ounces). Market telemetry may be subject to network latency, connection interruptions, or exchange delays. When live WebSocket streaming is interrupted, the platform activates a 2-second REST polling fallback.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">5. NO BROKERAGE OR TRADE EXECUTION</h2>
          <p>
            XAUUSD Intelligence is not a registered broker-dealer, introducing broker, or investment adviser. The platform does not hold client funds, custody assets, or execute trades on behalf of users. Users are solely responsible for their own risk management and trading decisions.
          </p>
        </section>

        <div className="pt-4 border-t border-terminal-border flex justify-between items-center text-xs">
          <span className="text-terminal-subtext">Last updated: October 2026</span>
          <Link href="/dashboard" className="text-terminal-gold hover:underline font-bold">
            Return to Dashboard ›
          </Link>
        </div>
      </div>
    </div>
  );
}
