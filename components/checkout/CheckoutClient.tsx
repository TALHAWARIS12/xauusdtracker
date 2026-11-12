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
  Coins,
  AlertTriangle,
  Smartphone,
  Mail,
  CheckCircle2,
} from "lucide-react";
import { PRICING_PLANS, getPlanById, PlanTier } from "@/lib/plan-config";

interface CheckoutClientProps {
  initialPlanId?: string;
  userEmail?: string | null;
  currentPlanId?: string | null;
  isSubscribed?: boolean;
}

type PaymentOption = "mpesa" | "crypto";
type CryptoOption = "USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH";

const CRYPTO_CONFIG: Record<
  CryptoOption,
  { name: string; symbol: string; network: string; rate: number }
> = {
  USDT_TRC20: {
    name: "Tether USD",
    symbol: "USDT",
    network: "TRON (TRC20)",
    rate: 1.0,
  },
  USDT_ERC20: {
    name: "Tether USD",
    symbol: "USDT",
    network: "Ethereum (ERC20)",
    rate: 1.0,
  },
  BTC: {
    name: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin Network",
    rate: 0.000011,
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    network: "Ethereum Mainnet",
    rate: 0.00034,
  },
};

export function CheckoutClient({
  initialPlanId = "monthly",
  userEmail,
  currentPlanId = null,
  isSubscribed = false,
}: CheckoutClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [activePaymentMethod, setActivePaymentMethod] = useState<PaymentOption>("mpesa");
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>("USDT_TRC20");
  const [checkoutEmail, setCheckoutEmail] = useState<string>(userEmail || "");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [isMpesaProcessing, setIsMpesaProcessing] = useState<boolean>(false);
  const [mpesaError, setMpesaError] = useState<string | null>(null);

  const [isCryptoProcessing, setIsCryptoProcessing] = useState<boolean>(false);
  const [cryptoError, setCryptoError] = useState<string | null>(null);

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
  const cryptoInfo = CRYPTO_CONFIG[selectedCrypto];
  const cryptoAmount = (plan.priceUsd * cryptoInfo.rate).toFixed(
    cryptoInfo.symbol === "USDT" ? 2 : 5
  );

  // ── 1. M-PESA CHECKOUT (INTASEND HOSTED) ────────────────────────────────────
  const handleMpesaCheckout = async () => {
    setMpesaError(null);

    const effectiveEmail = (userEmail || checkoutEmail || "")
      .trim()
      .toLowerCase();
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      setMpesaError(
        "Please enter your email address above so we can activate Pro access on your account immediately after payment."
      );
      return;
    }

    setIsMpesaProcessing(true);

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
          phoneNumber: cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(
          data.error || "Unable to initialize M-Pesa checkout. Please try again."
        );
      }

      // Smooth direct navigation to the secure IntaSend checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("M-Pesa checkout error:", err);
      setMpesaError(
        err?.message || "Failed to launch M-Pesa checkout. Please try again."
      );
      setIsMpesaProcessing(false);
    }
  };

  // ── 2. CRYPTO CHECKOUT (NOWPAYMENTS) ─────────────────────────────────────────
  const handleCryptoCheckout = async () => {
    setCryptoError(null);

    const effectiveEmail = (userEmail || checkoutEmail || "")
      .trim()
      .toLowerCase();
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      setCryptoError(
        "Please enter your email address above so we can activate Pro access on your account immediately after payment."
      );
      return;
    }

    setIsCryptoProcessing(true);

    try {
      const res = await fetch("/api/checkout/nowpayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          email: effectiveEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(
          data.error ||
            "Failed to initialize NOWPayments crypto checkout session."
        );
      }

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("NOWPayments checkout error:", err);
      setCryptoError(err?.message || "Failed to launch crypto checkout.");
      setIsCryptoProcessing(false);
    }
  };

  return (
    <div className="container-app py-8 max-w-5xl space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="badge-pro flex items-center gap-1.5 w-fit mx-auto">
          <Zap className="h-3.5 w-3.5 text-gold-300" />
          SECURE CHECKOUT · M-PESA &amp; CRYPTO
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Complete Your Pro Subscription
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Choose between Safaricom M-Pesa (Instant STK Push) or 200+ Cryptocurrencies (NOWPayments). Both activate Pro access immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Plans, Email, & Both Payment Options */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Plan Interval Picker */}
          <div className="card p-4 space-y-2.5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Select Subscription Plan
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {PRICING_PLANS.map((p) => {
                const isSelected = p.id === selectedPlanId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`rounded-xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-gold-300 bg-gold-400/10 shadow-gold"
                        : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="block text-[11px] font-medium text-slate-300">
                        {p.name}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-gold-300" />
                      )}
                    </div>
                    <span className="block font-display text-base font-bold text-white tabular mt-0.5">
                      ${p.priceUsd}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {p.intervalLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Account Email Box */}
          <div className="card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="checkout-account-email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-gold-300" />
                <span>2. Account Email for Instant Clearance</span>
              </label>
              {!userEmail && (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`}
                  className="text-[11px] font-semibold text-gold-300 hover:text-gold-200 transition"
                >
                  Sign in →
                </Link>
              )}
            </div>

            <input
              id="checkout-account-email"
              type="email"
              required
              readOnly={Boolean(userEmail)}
              value={checkoutEmail}
              onChange={(e) => {
                setCheckoutEmail(e.target.value);
                if (mpesaError) setMpesaError(null);
                if (cryptoError) setCryptoError(null);
              }}
              placeholder="Enter your email (e.g. trader@example.com)"
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition ${
                userEmail
                  ? "border-bull-400/30 bg-bull-500/10 text-bull-200 font-medium"
                  : "border-white/15 bg-ink-850 focus:border-gold-400"
              }`}
            />
          </div>

          {/* 3. BOTH PAYMENT OPTIONS VISIBLE AT THE SAME TIME */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-0.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                3. Choose Payment Method
              </h2>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-bull-400" />
                Both Options Active
              </span>
            </div>

            {/* Prominent Side-by-Side Selector Tabs — Visible Without Scrolling */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActivePaymentMethod("mpesa");
                  if (mpesaError) setMpesaError(null);
                }}
                className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer flex items-center gap-2.5 relative ${
                  activePaymentMethod === "mpesa"
                    ? "border-bull-400 bg-bull-400/15 shadow-lg shadow-bull-900/20 ring-1 ring-bull-400"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="h-8 w-8 rounded-lg bg-bull-500/20 border border-bull-400/30 flex items-center justify-center text-bull-300 shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">
                    Pay with M-Pesa
                  </span>
                  <span className="block text-[10px] text-bull-300 truncate">
                    Safaricom STK Push
                  </span>
                </div>
                {activePaymentMethod === "mpesa" && (
                  <span className="h-2 w-2 rounded-full bg-bull-400 absolute top-2 right-2 animate-pulse" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePaymentMethod("crypto");
                  if (cryptoError) setCryptoError(null);
                }}
                className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer flex items-center gap-2.5 relative ${
                  activePaymentMethod === "crypto"
                    ? "border-gold-300 bg-gold-400/15 shadow-gold ring-1 ring-gold-300"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
              >
                <div className="h-8 w-8 rounded-lg bg-gold-400/20 border border-gold-300/30 flex items-center justify-center text-gold-300 shrink-0">
                  <Coins className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">
                    Pay with Crypto
                  </span>
                  <span className="block text-[10px] text-gold-300 truncate">
                    USDT, BTC, ETH +200
                  </span>
                </div>
                {activePaymentMethod === "crypto" && (
                  <span className="h-2 w-2 rounded-full bg-gold-300 absolute top-2 right-2 animate-pulse" />
                )}
              </button>
            </div>

            {/* Error Banners */}
            {mpesaError && activePaymentMethod === "mpesa" && (
              <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{mpesaError}</span>
              </div>
            )}
            {cryptoError && activePaymentMethod === "crypto" && (
              <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{cryptoError}</span>
              </div>
            )}

            {/* Active Method Panel: M-PESA */}
            {activePaymentMethod === "mpesa" && (
              <div className="card p-5 space-y-4 border-bull-400/30 bg-bull-400/[0.02] animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-bull-400/30 bg-bull-400/15 px-2 py-0.5 text-[11px] font-bold text-bull-200">
                      M-PESA EXPRESS
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Safaricom Kenya · Airtel Money
                    </span>
                  </div>
                  <span className="text-[11px] text-bull-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Instant STK Push
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="mpesa_mobile_number"
                    className="text-xs font-medium text-slate-300 flex items-center justify-between"
                  >
                    <span>M-Pesa Mobile Number (Optional, for auto-prompt)</span>
                    <span className="text-[10px] text-slate-400 font-mono">
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
                    className="w-full rounded-xl border border-white/15 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-bull-400 focus:outline-none focus:ring-1 focus:ring-bull-400 font-mono"
                  />
                  <p className="text-[11px] text-slate-400">
                    Receive an immediate M-Pesa PIN prompt on your phone to complete your subscription.
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-bull-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Instant STK Push:</strong> Direct PIN prompt delivered to your phone with automatic KES conversion.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-bull-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>Zero-Delay Clearance:</strong> Account upgrades to Pro institutional access immediately upon confirmation.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isMpesaProcessing}
                  onClick={handleMpesaCheckout}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-gold cursor-pointer disabled:opacity-50"
                  id="mpesa-checkout-btn"
                >
                  {isMpesaProcessing ? (
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
              </div>
            )}

            {/* Active Method Panel: CRYPTO */}
            {activePaymentMethod === "crypto" && (
              <div className="card p-5 space-y-4 border-gold-400/30 bg-gold-400/[0.02] animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Select Cryptocurrency
                  </span>
                  <span className="text-[11px] text-gold-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    200+ Coins Supported
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(CRYPTO_CONFIG) as CryptoOption[]).map((key) => {
                    const c = CRYPTO_CONFIG[key];
                    const isSelected = selectedCrypto === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedCrypto(key)}
                        className={`rounded-lg border p-2 text-center transition-all cursor-pointer ${
                          isSelected
                            ? "border-gold-300 bg-gold-400/15 text-white shadow-gold font-bold"
                            : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-white"
                        }`}
                      >
                        <span className="block text-xs">{c.symbol}</span>
                        <span className="block text-[9px] text-slate-400 truncate">
                          {c.network.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Equivalent Amount:</span>
                    <span className="font-display font-bold text-white tabular">
                      {cryptoAmount} {cryptoInfo.symbol} (${plan.priceUsd}.00)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Network:</span>
                    <span className="font-semibold text-gold-300">
                      {cryptoInfo.network}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isCryptoProcessing}
                  onClick={handleCryptoCheckout}
                  className="btn-secondary w-full py-3 text-sm font-bold cursor-pointer hover:border-gold-300 hover:text-gold-200 disabled:opacity-50"
                  id="nowpayments-checkout-btn"
                >
                  {isCryptoProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Connecting to NOWPayments...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4 text-gold-300" />
                      <span>Pay with Crypto (${plan.priceUsd})</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Order Summary */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card p-5 space-y-4">
            <div className="border-b border-white/[0.06] pb-3">
              <span className="badge-pro mb-1.5">Selected Plan</span>
              <h2 className="font-display text-lg font-bold text-white">
                {plan.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {plan.description}
              </p>
            </div>

            <div className="flex items-baseline justify-between py-1.5 border-b border-white/[0.06]">
              <span className="text-xs text-slate-300">Total:</span>
              <div className="text-right">
                <span className="font-display text-2xl font-extrabold text-white tabular">
                  ${plan.priceUsd}
                </span>
                <span className="text-xs text-slate-400 ml-1">
                  {plan.intervalLabel}
                </span>
              </div>
            </div>

            {/* Features checklist */}
            <div className="space-y-2 text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block">
                Included with Pro:
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
                Clearance activates automatically upon M-Pesa or Crypto confirmation. Cancel anytime.
              </p>
            </div>

            <div className="pt-0.5">
              <Link
                href="/pricing"
                className="btn-ghost w-full text-xs text-slate-400 hover:text-white text-center block"
              >
                ‹ View All Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
