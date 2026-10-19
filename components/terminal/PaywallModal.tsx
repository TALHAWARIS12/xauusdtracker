"use client";

import { useState } from "react";
import { Lock, Sparkles, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";

export function PaywallModal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to initialize Stripe checkout.");
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No checkout URL returned from server.");
      }
    } catch (err) {
      console.error("Subscription checkout error:", err);
      setError(err instanceof Error ? err.message : "Checkout error");
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-terminal-black/75 backdrop-blur-md rounded-lg select-none">
      <div className="w-full max-w-lg bg-terminal-surface border border-terminal-gold/50 rounded-xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center space-y-5">
        {/* Lock Badge Icon */}
        <div className="mx-auto w-14 h-14 rounded-full bg-terminal-gold/10 border border-terminal-gold/40 flex items-center justify-center text-terminal-gold shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Lock className="w-7 h-7" />
        </div>

        {/* Title & Headline */}
        <div className="space-y-2">
          <span className="text-[10px] tracking-widest text-terminal-gold uppercase font-extrabold px-2.5 py-0.5 rounded bg-terminal-gold/10 border border-terminal-gold/30 inline-block">
            INSTITUTIONAL CLEARANCE REQUIRED
          </span>
          <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug">
            Unlock Full Institutional Terminal Access — Real-time XAU/USD Stop-Loss & Take-Profit Concentration Pools
          </h2>
          <p className="text-xs text-terminal-subtext max-w-md mx-auto leading-relaxed">
            Gain immediate visibility into proprietary algorithmic liquidation hunt zones, institutional Fibonacci expansion targets, and retail order depth clusters.
          </p>
        </div>

        {/* Premium Features List */}
        <div className="bg-terminal-card/80 border border-terminal-border rounded-lg p-3.5 text-left text-xs space-y-2 font-mono">
          <div className="flex items-center gap-2 text-gray-200">
            <Sparkles className="w-3.5 h-3.5 text-terminal-green shrink-0" />
            <span>Real-time Buyer & Seller Stop-Loss Liquidation Clusters</span>
          </div>
          <div className="flex items-center gap-2 text-gray-200">
            <ShieldCheck className="w-3.5 h-3.5 text-terminal-gold shrink-0" />
            <span>Fibonacci 0.618 Dynamic Take-Profit Target Lines</span>
          </div>
          <div className="flex items-center gap-2 text-gray-200">
            <ShieldCheck className="w-3.5 h-3.5 text-terminal-green shrink-0" />
            <span>Complete Order Flow Concentration Depth & Notional Ratios</span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <p className="text-xs text-terminal-red font-mono bg-terminal-red/10 border border-terminal-red/30 py-1.5 px-3 rounded">
            {error}
          </p>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 border border-terminal-gold shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-terminal-black" />
                <span>CONNECTING TO STRIPE SECURE GATEWAY...</span>
              </>
            ) : (
              <>
                <span>SUBSCRIBE NOW — UNLOCK TERMINAL ACCESS</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <span className="block mt-2 text-[10px] text-terminal-subtext">
            Cancel anytime · Instant activation via Stripe Webhooks · 256-Bit SSL
          </span>
        </div>
      </div>
    </div>
  );
}
