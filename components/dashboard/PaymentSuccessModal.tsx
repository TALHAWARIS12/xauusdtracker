"use client";

import { CheckCircle2, Crown, Sparkles, ArrowRight } from "lucide-react";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName?: string;
}

export function PaymentSuccessModal({ isOpen, onClose, planName = "Pro Membership" }: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
    >
      <div className="card relative w-full max-w-md p-8 text-center space-y-6 shadow-glow border border-bull-400/30 animate-scale-in">
        {/* Success Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-bull-400/20 to-bull-500/10 border border-bull-400/40 text-bull-300 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-bull-400/30 bg-bull-400/10 px-3 py-1 text-xs font-semibold text-bull-300">
            <Crown className="h-3.5 w-3.5 text-gold-300" />
            <span>PAYMENT CONFIRMED</span>
          </div>

          <h2 id="success-modal-title" className="font-display text-2xl font-bold text-white tracking-tight">
            Payment Successful! Your Pro access is now active.
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
            Welcome to <strong className="text-white">{planName}</strong>. All real-time order flow depth, live tick micro-charts, and high-frequency trade signals are completely unlocked.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left text-xs space-y-2 text-slate-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bull-300 shrink-0" />
            <span>Zero-delay tick-by-tick gold spot price & chart</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold-300 shrink-0" />
            <span>Proprietary liquidity concentration pools & Fibonacci targets</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-bull-300 shrink-0" />
            <span>Automated rule-based trade setups & R:R analytics</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn-primary w-full py-3 text-sm font-semibold shadow-gold cursor-pointer"
          id="success-modal-continue-btn"
        >
          <span>Access Pro Dashboard</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
