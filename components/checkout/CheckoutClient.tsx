"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Smartphone,
  CreditCard,
  Mail,
  Shield,
  CheckCircle2,
} from "lucide-react";
import { PRICING_PLANS, getPlanById, PlanTier } from "@/lib/plan-config";

interface CheckoutClientProps {
  initialPlanId?: string;
  userEmail?: string | null;
  currentPlanId?: string | null;
  isSubscribed?: boolean;
}

type PaymentMethod = "mpesa" | "card";

export function CheckoutClient({
  initialPlanId = "monthly",
  userEmail,
  currentPlanId = null,
  isSubscribed = false,
}: CheckoutClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mpesa");
  const [checkoutEmail, setCheckoutEmail] = useState<string>(userEmail || "");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userEmail && !checkoutEmail) {
      setCheckoutEmail(userEmail);
    }
  }, [userEmail, checkoutEmail]);

  // Clean up any stale legacy cookies on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sandbox_pro");
      document.cookie =
        "sandbox_pro=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "pro_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, []);

  const plan: PlanTier = getPlanById(selectedPlanId);

  // ── UNIFIED INTASEND CHECKOUT (M-PESA & CARD) ──────────────────────────────
  const handleCheckout = async (overrideMethod?: PaymentMethod) => {
    setErrorMessage(null);

    const activeMethod = overrideMethod || paymentMethod;

    const effectiveEmail = (userEmail || checkoutEmail || "")
      .trim()
      .toLowerCase();
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      setErrorMessage(
        "Please enter a valid email address so we can activate your Pro subscription immediately upon payment confirmation."
      );
      return;
    }

    setIsProcessing(true);

    try {
      const cleanPhone =
        phoneNumber &&
        !phoneNumber.includes("@") &&
        phoneNumber.replace(/\D/g, "").length >= 9
          ? phoneNumber.trim()
          : undefined;

      const res = await fetch("/api/checkout/intasend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          email: effectiveEmail,
          phoneNumber: activeMethod === "mpesa" ? cleanPhone : undefined,
          method: activeMethod === "mpesa" ? "M-PESA" : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(
          data.error ||
            "Unable to initialize secure checkout session. Please try again."
        );
      }

      // Redirect user to the secure IntaSend checkout session
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      setErrorMessage(
        err?.message ||
          "Failed to launch secure checkout. Please check your connection and try again."
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-app py-10 max-w-5xl space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="badge-pro flex items-center gap-1.5 w-fit mx-auto">
          <Zap className="h-3.5 w-3.5 text-gold-300" />
          SECURE CHECKOUT · M-PESA &amp; CARD
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Complete Your Pro Subscription
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Choose between Safaricom M-Pesa (Instant STK Push) or Debit / Credit Card (Visa &amp; Mastercard). Both activate your Pro institutional access immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Plan selector, Email & Payment Methods (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Plan Interval Picker */}
          <div className="card p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Select Your Subscription Plan
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRICING_PLANS.map((p) => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-gold-300 bg-gold-400/10 shadow-gold"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-[11px] font-medium text-slate-400">
                        {p.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-gold-300" />
                      )}
                    </div>
                    <span className="block font-display text-lg font-bold text-white tabular mt-1">
                      ${p.priceUsd}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {p.intervalLabel}
                    </span>
                    {p.badge && (
                      <span className="mt-1.5 inline-block text-[9px] font-bold text-gold-300">
                        {p.id === "yearly" ? "Save 67%" : "Popular"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Account Email Box */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="checkout-account-email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-gold-300" />
                <span>2. Account Email for Instant Activation</span>
              </label>
              {!userEmail && (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`}
                  className="text-xs font-semibold text-gold-300 hover:text-gold-200 transition"
                >
                  Already have an account? Sign in →
                </Link>
              )}
            </div>

            <div className="relative">
              <input
                id="checkout-account-email"
                type="email"
                required
                readOnly={Boolean(userEmail)}
                value={checkoutEmail}
                onChange={(e) => {
                  setCheckoutEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter your email address (e.g. trader@example.com)"
                className={`w-full rounded-xl border px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition ${
                  userEmail
                    ? "border-bull-400/30 bg-bull-500/10 text-bull-200 font-medium"
                    : "border-white/15 bg-ink-850 focus:border-gold-400"
                }`}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              {userEmail
                ? "Signed in — your Pro subscription will activate directly on this account."
                : "Your account credentials and Pro subscription clearance will be sent to this email immediately."}
            </p>
          </div>

          {/* 3. Payment Method Choice (M-Pesa & Card) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                3. Choose Payment Method
              </h2>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-bull-400" />
                256-Bit Encrypted
              </span>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("mpesa");
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                  paymentMethod === "mpesa"
                    ? "border-bull-400 bg-bull-400/10 shadow-lg shadow-bull-900/20"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-bull-500/20 border border-bull-400/30 flex items-center justify-center text-bull-300">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  {paymentMethod === "mpesa" && (
                    <span className="h-2.5 w-2.5 rounded-full bg-bull-400 animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="block text-sm font-bold text-white">
                    M-Pesa (Mobile)
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Safaricom STK Push
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod("card");
                  if (errorMessage) setErrorMessage(null);
                }}
                className={`rounded-xl border p-4 text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                  paymentMethod === "card"
                    ? "border-gold-300 bg-gold-400/10 shadow-gold"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-lg bg-gold-400/20 border border-gold-300/30 flex items-center justify-center text-gold-300">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  {paymentMethod === "card" && (
                    <span className="h-2.5 w-2.5 rounded-full bg-gold-300 animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="block text-sm font-bold text-white">
                    Debit / Credit Card
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    Visa &amp; Mastercard
                  </span>
                </div>
              </button>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Detailed View for M-PESA */}
            {paymentMethod === "mpesa" && (
              <div className="card p-6 space-y-5 border-bull-400/30 bg-bull-400/[0.02] relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-bull-500/15 border border-bull-400/30 flex items-center justify-center text-bull-300">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Pay with Safaricom M-Pesa
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Instant STK PIN Prompt to Your Phone
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-bull-300 flex items-center gap-1 font-semibold bg-bull-400/10 border border-bull-400/20 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Instant STK Push
                  </span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-lg border border-bull-400/30 bg-bull-400/15 px-3 py-1 text-xs font-bold text-bull-200 tracking-wider">
                    M-PESA EXPRESS
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    Safaricom Kenya
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    Airtel Money
                  </span>
                </div>

                {/* Optional Phone Number Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="mpesa_mobile_number"
                    className="text-xs font-medium text-slate-300 flex items-center justify-between"
                  >
                    <span>M-Pesa Mobile Number (Optional, for auto-prompt)</span>
                    <span className="text-[11px] text-slate-400">
                      e.g. 0712345678 or 2547...
                    </span>
                  </label>
                  <input
                    id="mpesa_mobile_number"
                    name="mpesa_mobile_number"
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full rounded-xl border border-white/15 bg-ink-850 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-bull-400 focus:outline-none focus:ring-1 focus:ring-bull-400 font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Enter your phone number to automatically receive the M-Pesa PIN prompt on your phone, or enter it on the next screen.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Instant STK Push:</strong> A secure PIN prompt will appear directly on your phone screen.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Real-Time Clearance:</strong> Pro institutional access unlocks immediately the moment you confirm your PIN.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCheckout("mpesa")}
                  className="btn-primary w-full py-3.5 text-sm font-bold shadow-gold cursor-pointer disabled:opacity-50"
                  id="mpesa-checkout-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting to M-Pesa...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="h-4 w-4" />
                      <span>Pay with M-Pesa (${plan.priceUsd})</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  Direct Safaricom M-Pesa mobile money checkout · Instant activation
                </p>
              </div>
            )}

            {/* Detailed View for CARD PAYMENT */}
            {paymentMethod === "card" && (
              <div className="card p-6 space-y-5 border-gold-300/30 bg-gold-400/[0.02] relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gold-400/15 border border-gold-300/30 flex items-center justify-center text-gold-300">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                        Pay with Debit or Credit Card
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Visa, Mastercard &amp; Global Debit/Credit Cards
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-gold-300 flex items-center gap-1 font-semibold bg-gold-400/10 border border-gold-400/20 px-2.5 py-1 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    3D Secure Verified
                  </span>
                </div>

                {/* Card Brand Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="rounded-lg border border-gold-300/30 bg-gold-400/15 px-3 py-1 text-xs font-bold text-gold-200 tracking-wider">
                    VISA
                  </span>
                  <span className="rounded-lg border border-gold-300/30 bg-gold-400/15 px-3 py-1 text-xs font-bold text-gold-200 tracking-wider">
                    MASTERCARD
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    DEBIT &amp; CREDIT
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                    PESALINK / BANK
                  </span>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Global Card Processing:</strong> Processed securely via IntaSend with full 3D-Secure fraud protection.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Instant Account Activation:</strong> Immediate subscription clearance upon card payment confirmation.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Bank-Grade Encryption:</strong> PCI-DSS Level 1 compliant processing with 256-bit SSL encryption.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCheckout("card")}
                  className="btn-primary w-full py-3.5 text-sm font-bold shadow-gold cursor-pointer disabled:opacity-50"
                  id="card-checkout-btn"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting to Card Gateway...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Pay with Card (${plan.priceUsd})</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400">
                  Secure 256-bit encrypted card checkout · Powered by IntaSend
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 space-y-5">
            <div className="border-b border-white/[0.06] pb-4">
              <span className="badge-pro mb-2">Selected Plan</span>
              <h2 className="font-display text-xl font-bold text-white">
                {plan.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="flex items-baseline justify-between py-2 border-b border-white/[0.06]">
              <span className="text-sm text-slate-300">Subscription Total:</span>
              <div className="text-right">
                <span className="font-display text-3xl font-extrabold text-white tabular">
                  ${plan.priceUsd}
                </span>
                <span className="text-xs text-slate-400 ml-1">
                  {plan.intervalLabel}
                </span>
              </div>
            </div>

            {/* Selected Method Summary */}
            <div className="flex items-center justify-between text-xs py-1 text-slate-300">
              <span className="text-slate-400">Payment Rails:</span>
              <span className="font-semibold text-white flex items-center gap-1.5">
                {paymentMethod === "mpesa" ? (
                  <>
                    <Smartphone className="h-3.5 w-3.5 text-bull-400" />
                    M-Pesa STK Push
                  </>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5 text-gold-300" />
                    Visa / Mastercard
                  </>
                )}
              </span>
            </div>

            {/* Features checklist */}
            <div className="space-y-2.5 text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
                What&apos;s Included:
              </span>
              {plan.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-slate-300">
                  <Check className="h-3.5 w-3.5 text-bull-300 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Lock className="h-3.5 w-3.5 text-gold-300" />
                <span>Instant Account Activation</span>
              </div>
              <p>
                Your clearance activates automatically upon M-Pesa or Card confirmation. Cancel or change plan anytime from Account settings.
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/pricing"
                className="btn-ghost w-full text-xs text-slate-400 hover:text-white text-center block"
              >
                ‹ View All Plans &amp; Comparison
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
