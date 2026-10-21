"use client";

import Link from "next/link";
import { Lock, Sparkles, ArrowRight } from "lucide-react";

interface PaywallGateOverlayProps {
  heading?: string;
  subtext?: string;
  buttonText?: string;
  pricingHref?: string;
  className?: string;
  compact?: boolean;
}

export function PaywallGateOverlay({
  heading = "Unlock Real-Time Institutional Order Flow",
  subtext = "Subscribe to access zero-delay tick data, depth charts, and automated broker signals.",
  buttonText = "Choose Your Plan",
  pricingHref = "/pricing",
  className = "",
  compact = false,
}: PaywallGateOverlayProps) {
  return (
    <div
      className={`absolute inset-0 z-30 flex items-center justify-center p-4 rounded-xl bg-ink-950/70 backdrop-blur-md transition-all duration-300 ${className}`}
    >
      <div
        className={`w-full text-center space-y-4 rounded-2xl border border-gold-300/30 bg-gradient-to-b from-ink-900/95 to-ink-950/95 p-6 shadow-glow ${
          compact ? "max-w-sm py-5" : "max-w-md py-8"
        }`}
      >
        {/* Glow badge icon */}
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-300/20 to-gold-500/10 border border-gold-300/40 text-gold-300 shadow-gold">
          <Lock className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <span className="badge-pro">
            <Sparkles className="h-3 w-3" />
            PRO FEATURE
          </span>
          <h3 className="font-display text-lg font-bold text-white tracking-tight leading-snug">
            {heading}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            {subtext}
          </p>
        </div>

        <div className="pt-2">
          <Link
            href={pricingHref}
            className="btn-primary w-full py-2.5 text-sm font-semibold shadow-gold"
            id="paywall-choose-plan-btn"
          >
            <span>{buttonText}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-[11px] text-slate-400">
            Instant activation · Cards & Crypto accepted · From $3/day
          </p>
        </div>
      </div>
    </div>
  );
}
