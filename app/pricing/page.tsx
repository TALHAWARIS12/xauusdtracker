import Link from "next/link";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { INITIAL_PLAN } from "@/lib/plan-config";
import { Check, ShieldCheck, Zap, Lock, ArrowRight, HelpCircle } from "lucide-react";

export default async function PricingPage() {
  const session = await auth();
  const isSubscribed = session?.user?.id
    ? await getSubscriptionStatus(session.user.id)
    : false;

  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8 select-none">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-terminal-gold/10 border border-terminal-gold/30 text-terminal-gold text-[11px] font-bold tracking-widest uppercase">
          <Zap className="w-3.5 h-3.5" />
          <span>INSTITUTIONAL ACCESS TIER</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
          Direct XAU/USD Quantitative Intelligence
        </h1>
        <p className="text-terminal-subtext max-w-xl mx-auto text-xs sm:text-sm leading-relaxed">
          Transparent, rule-based algorithmic analysis, real-time stop-loss/take-profit concentration zones, and multi-indicator trade setup telemetry.
        </p>
      </div>

      {/* Plan Card */}
      <div className="max-w-xl mx-auto bg-terminal-surface border border-terminal-gold/60 rounded-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] space-y-6">
        <div className="flex items-center justify-between border-b border-terminal-border/80 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
              {INITIAL_PLAN.name}
            </h2>
            <p className="text-terminal-subtext text-xs mt-0.5">
              Single all-inclusive tier · Cancel anytime
            </p>
          </div>
          <span className="px-2.5 py-1 rounded bg-terminal-green/10 text-terminal-green border border-terminal-green/30 text-[10px] font-extrabold tracking-widest uppercase">
            FULL ACCESS
          </span>
        </div>

        {/* Pricing tag */}
        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-extrabold text-white tabular-nums tracking-tight">
            ${INITIAL_PLAN.priceUsd.toFixed(0)}
          </span>
          <span className="text-terminal-subtext text-sm">
            / {INITIAL_PLAN.billingInterval}
          </span>
          <span className="text-[10px] text-terminal-subtext ml-2">
            (Billed monthly via Stripe)
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-xs leading-relaxed">
          {INITIAL_PLAN.tagline}
        </p>

        {/* Included Features List */}
        <div className="space-y-3 pt-2">
          <span className="text-[11px] font-bold text-terminal-gold tracking-wider uppercase block">
            INCLUDED QUANTITATIVE MODULES:
          </span>
          <ul className="space-y-2.5">
            {INITIAL_PLAN.features.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-200">
                <Check className="w-4 h-4 text-terminal-green shrink-0 mt-0.5" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-terminal-border">
          {isSubscribed ? (
            <div className="p-3 bg-terminal-green/10 border border-terminal-green/40 rounded text-center space-y-1">
              <span className="text-terminal-green font-bold text-xs flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                YOUR INSTITUTIONAL CLEARANCE IS ACTIVE
              </span>
              <p className="text-[11px] text-terminal-subtext">
                You already hold unrestricted access to the terminal workspace.
              </p>
              <Link
                href="/terminal"
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold rounded text-xs transition"
              >
                <span>OPEN RADAR TERMINAL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : session ? (
            <form action="/api/stripe/checkout" method="POST">
              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 border border-terminal-gold shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer"
              >
                <span>PROCEED TO SECURE CHECKOUT ($99/MO)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              <Link
                href="/login?callbackUrl=/pricing"
                className="w-full py-3.5 px-6 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 border border-terminal-gold shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <Lock className="w-4 h-4" />
                <span>SIGN IN TO SUBSCRIBE</span>
              </Link>
              <p className="text-center text-[10px] text-terminal-subtext">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-terminal-gold hover:underline">
                  Register new operator clearance
                </Link>
              </p>
            </div>
          )}
        </div>

        {/* Security & Cancellation Terms */}
        <div className="text-[10px] text-terminal-subtext space-y-1 text-center border-t border-terminal-border/60 pt-4">
          <p>
            • Cancel anytime from your account settings. Access remains active until the end of your billing cycle.
          </p>
          <p>
            • Hosted on Stripe 256-Bit SSL. Card details are never stored on platform servers.
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-xl mx-auto space-y-4 pt-6">
        <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-terminal-border pb-2">
          <HelpCircle className="w-4 h-4 text-terminal-gold" />
          <span>FREQUENTLY ASKED QUESTIONS</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 space-y-1">
            <h3 className="font-bold text-white">What market data feed powers the platform?</h3>
            <p className="text-terminal-subtext leading-relaxed">
              Live market telemetry connects to institutional spot gold tracking (PAXG/USDT backed 1:1 by physical troy ounces of London Good Delivery gold), streaming via high-throughput WebSocket with automatic REST polling failover.
            </p>
          </div>

          <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 space-y-1">
            <h3 className="font-bold text-white">Are stop-loss and take-profit zones actual broker orders?</h3>
            <p className="text-terminal-subtext leading-relaxed">
              No. As explicitly stated in our risk disclosures, global private broker orders are not observable across the decentralized spot market. Zones are modelled mathematical estimates calculated from price structure, swing pivots, and volume distributions.
            </p>
          </div>

          <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 space-y-1">
            <h3 className="font-bold text-white">Does XAUUSD Intelligence execute live trades?</h3>
            <p className="text-terminal-subtext leading-relaxed">
              No. The platform is strictly an informational and quantitative research terminal. It does not place broker orders or execute automated trades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
