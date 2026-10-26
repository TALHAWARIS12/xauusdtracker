"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Crown, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { PRICING_PLANS } from "@/lib/plan-config";

interface PricingMatrixProps {
  isSubscribed?: boolean;
  activePlanId?: string | null;
}

export function PricingMatrix({ isSubscribed = false, activePlanId = null }: PricingMatrixProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(activePlanId || "monthly");

  return (
    <div className="space-y-12" id="pricing-matrix-container">
      {/* 2 Subscription Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        {PRICING_PLANS.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          const isPopular = plan.isPopular;
          const isYearly = plan.id === "yearly";
          const isCurrentPlan = isSubscribed && activePlanId === plan.id;
          const isOtherPlanWhenSubscribed = isSubscribed && !isCurrentPlan;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`card relative flex flex-col justify-between p-6 transition-all duration-300 cursor-pointer ${
                isCurrentPlan
                  ? "border-bull-400/60 shadow-[0_0_30px_rgba(52,211,153,0.15)] bg-gradient-to-b from-bull-950/20 to-ink-950 scale-[1.01]"
                  : isSelected
                  ? "border-gold-300 shadow-glow bg-gradient-to-b from-ink-900 to-ink-950 scale-[1.02]"
                  : "hover:border-white/20 hover:bg-white/[0.04]"
              } ${isPopular && !isCurrentPlan ? "lg:-translate-y-2" : ""}`}
              id={`pricing-card-${plan.id}`}
            >
              {/* Badge */}
              {isCurrentPlan ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge shadow-sm bg-gradient-to-r from-bull-400 to-bull-500 text-ink-950 font-bold flex items-center gap-1 text-[11px] px-3 py-0.5">
                    <Check className="h-3 w-3 stroke-[3]" />
                    CURRENT ACTIVE PLAN
                  </span>
                </div>
              ) : plan.badge ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className={`badge shadow-sm ${
                      isYearly
                        ? "bg-gradient-to-r from-bull-400 to-bull-500 text-ink-950 font-bold"
                        : "badge-pro"
                    }`}
                  >
                    {isYearly ? <Crown className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                    {plan.badge}
                  </span>
                </div>
              ) : null}

              <div>
                {/* Header */}
                <div className="border-b border-white/[0.06] pb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-lg font-bold text-white">
                      {plan.name}
                    </h3>
                    {isCurrentPlan && (
                      <span className="text-[10px] font-bold text-bull-300 uppercase tracking-wider bg-bull-400/10 px-2 py-0.5 rounded border border-bull-400/30">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px] leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="py-4">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular">
                      ${plan.priceUsd}
                    </span>
                    <span className="text-xs text-slate-400">
                      {plan.intervalLabel}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    {plan.billingText}
                  </span>
                </div>

                {/* Features */}
                <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Features Included:
                  </span>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <Check className="h-3.5 w-3.5 text-bull-300 shrink-0 mt-0.5" />
                      <span className="leading-tight">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-white/[0.06]">
                {isCurrentPlan ? (
                  <div className="space-y-2">
                    <Link
                      href="/dashboard"
                      className="btn-primary w-full py-2.5 text-xs font-semibold shadow-gold flex items-center justify-center gap-2"
                      id={`active-plan-${plan.id}-btn`}
                    >
                      <span>Clearance Active → Open Dashboard</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-[11px] text-bull-300 block text-center font-medium">
                      ✓ Your current active tier
                    </span>
                  </div>
                ) : isOtherPlanWhenSubscribed ? (
                  <div className="space-y-2">
                    <Link
                      href={`/checkout?plan=${plan.id}`}
                      className="btn-secondary w-full py-2.5 text-xs font-semibold hover:border-gold-300 hover:text-gold-200 flex items-center justify-center gap-2"
                      id={`upgrade-plan-${plan.id}-btn`}
                    >
                      <span>{isYearly ? "Upgrade to Yearly ($188/yr)" : "Switch to Monthly ($48/mo)"}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <span className="text-[11px] text-slate-400 block text-center">
                      {isYearly ? "Upgrade annual clearance & save 67%" : "Switch billing cycle"}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`/checkout?plan=${plan.id}`}
                    className={`w-full py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
                      isSelected || isPopular
                        ? "btn-primary shadow-gold"
                        : "btn-secondary"
                    }`}
                    id={`select-plan-${plan.id}-btn`}
                  >
                    <span>Subscribe Now — ${plan.priceUsd}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bull-400/10 text-bull-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">100% Risk-Free Guarantee</h4>
            <p className="text-xs text-slate-400">
              Instant activation upon blockchain confirmation. Pay securely via NOWPayments with USDT, BTC, ETH, and 200+ coins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-bull-300" />
            Instant Activation
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-bull-300" />
            Crypto (NOWPayments)
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-bull-300" />
            Zero Delay Feed
          </span>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="space-y-4 max-w-3xl mx-auto pt-6">
        <div className="flex items-center gap-2 text-base font-bold text-white border-b border-white/[0.06] pb-3">
          <HelpCircle className="h-5 w-5 text-gold-300" />
          <h2>Frequently Asked Questions</h2>
        </div>

        <div className="grid gap-3 text-xs">
          <div className="card-muted p-4 space-y-1.5">
            <h3 className="font-semibold text-white text-sm">How does the Cryptocurrency checkout work?</h3>
            <p className="text-slate-400 leading-relaxed">
              Payments are handled through our NOWPayments cryptocurrency gateway. You can pay with USDT (TRC20/ERC20), Bitcoin, Ethereum, Solana, and over 200 other digital assets. Once the blockchain transaction confirms, your Pro clearance activates immediately.
            </p>
          </div>

          <div className="card-muted p-4 space-y-1.5">
            <h3 className="font-semibold text-white text-sm">What is the difference between Free and Pro access?</h3>
            <p className="text-slate-400 leading-relaxed">
              The free view displays aggregated estimates and delayed sentiment with order flow depth blurred. Subscribing to Pro unlocks unthrottled zero-delay tick data, live order book clusters, dynamic Fibonacci targets, and automated trade signals.
            </p>
          </div>

          <div className="card-muted p-4 space-y-1.5">
            <h3 className="font-semibold text-white text-sm">Can I cancel my subscription at any time?</h3>
            <p className="text-slate-400 leading-relaxed">
              Yes. You can manage or cancel your subscription at any time from your Account settings. Access remains active through the end of your prepaid period.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
