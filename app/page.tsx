import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  Layers,
  Calculator,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { PricingMatrix } from "@/components/pricing/PricingMatrix";
import { HomeSpotWidget } from "@/components/market/HomeSpotWidget";

export default async function HomePage() {
  let session = null;
  try {
    session = await auth();
  } catch {}

  const isSubscribed = await getSubscriptionStatus(session?.user?.id);

  return (
    <div className="flex-1 space-y-20 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 lg:pt-24">
        {/* Glow backdrop */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-tr from-gold-400/15 via-gold-300/10 to-transparent blur-3xl" />

        <div className="container-app relative text-center space-y-6 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold text-gold-200 shadow-gold animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull-400 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-bull-400" />
            </span>
            <span>NEXT-GENERATION XAU/USD INTELLIGENCE</span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] animate-fade-up">
            Trade Gold with <br className="hidden sm:inline" />
            <span className="text-gradient-gold">Institutional Order Flow</span> Clarity
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed animate-fade-up">
            Real-time gold spot price, buyer vs. seller volume sentiment, algorithmic liquidation pools, and automated trade signals in one polished dashboard.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 animate-fade-up">
            <Link
              href="/dashboard"
              className="btn-primary w-full sm:w-auto px-7 py-3.5 text-sm font-semibold shadow-gold"
              id="hero-launch-dashboard-btn"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="#pricing"
              className="btn-secondary w-full sm:w-auto px-6 py-3.5 text-sm font-semibold"
              id="hero-view-plans-btn"
            >
              <Sparkles className="h-4 w-4 text-gold-300" />
              <span>View Pricing Plans (from $3)</span>
            </Link>
          </div>

          {/* Trust bullet line */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-bull-400" />
              Real-Time Tick Telemetry
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-bull-400" />
              Crypto Checkout (NOWPayments)
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-bull-400" />
              Zero Delayed Broker Jargon
            </span>
          </div>
        </div>
      </section>

      {/* LIVE MARKET SPOT WIDGET */}
      <section className="container-app max-w-5xl">
        <div className="text-center space-y-2 mb-6">
          <span className="eyebrow">LIVE MARKET PREVIEW</span>
          <h2 className="text-2xl font-bold text-white">Real-Time Gold Ticker & Volume Delta</h2>
        </div>
        <HomeSpotWidget isPro={isSubscribed} />
      </section>

      {/* FEATURE SHOWCASE GRID */}
      <section className="container-app py-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="eyebrow">PROPRIETARY QUANTITATIVE SUITE</span>
          <h2 className="font-display text-3xl font-bold text-white tracking-tight">
            Engineered for Precision Gold Trading
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Eliminate guesswork with mathematical price action structures, transparent indicators, and automated risk models.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-6 space-y-3 transition hover:border-gold-300/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-semibold text-white">
              Liquidity Concentration Pools
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Algorithmic stop-loss clusters and take-profit expansion levels derived directly from 15-candle price structures and Fibonacci 0.618 extensions.
            </p>
          </div>

          <div className="card p-6 space-y-3 transition hover:border-gold-300/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bull-400/10 text-bull-300">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-semibold text-white">
              Rule-Based Signal Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transparent confluence evaluation testing EMA(20/50) trend direction, RSI momentum boundaries, and minimum 1.5:1 reward-to-risk ratios.
            </p>
          </div>

          <div className="card p-6 space-y-3 transition hover:border-gold-300/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-400/10 text-gold-300">
              <Calculator className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-semibold text-white">
              Position Sizing Calculator
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive lot-sizing and pip risk calculator calibrated for standard 100 troy ounce gold contracts, with live stop and target distance validation.
            </p>
          </div>

          <div className="card p-6 space-y-3 transition hover:border-gold-300/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bull-400/10 text-bull-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="font-display text-base font-semibold text-white">
              Multi-Session Regime Matrix
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Detect active London and New York liquidity overlaps in real time, with volatility expansion metrics (ATR 14) and volume delta tracking.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION ANCHOR */}
      <section id="pricing" className="container-app py-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="badge-pro">
            AFFORDABLE SAAS ACCESS
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Choose Your Trading Plan
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Full sandbox test checkout active. Select any pass interval to test with card or crypto in seconds.
          </p>
        </div>

        <PricingMatrix isSubscribed={isSubscribed} />
      </section>

      {/* FINAL CTA BANNER */}
      <section className="container-app max-w-5xl">
        <div className="card relative overflow-hidden p-8 sm:p-12 text-center space-y-6 border border-gold-300/30 bg-gradient-to-b from-ink-900 to-ink-950 shadow-glow">
          <div className="max-w-xl mx-auto space-y-3">
            <span className="badge-live">
              JOIN THOUSANDS OF GOLD TRADERS
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-bold text-white tracking-tight">
              Ready to Upgrade Your Gold Trading Strategy?
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Gain instant access to institutional order flow depth, real-time tick charts, and automated signals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="btn-primary w-full sm:w-auto px-8 py-3.5 text-sm font-semibold shadow-gold"
            >
              <span>Explore Dashboard (Free)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/checkout?plan=monthly"
              className="btn-secondary w-full sm:w-auto px-6 py-3.5 text-sm font-semibold"
            >
              <span>Subscribe to Pro ($48/mo)</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
