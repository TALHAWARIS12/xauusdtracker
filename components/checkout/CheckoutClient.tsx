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
} from "lucide-react";
import { PRICING_PLANS, getPlanById, PlanTier } from "@/lib/plan-config";

interface CheckoutClientProps {
  initialPlanId?: string;
  userEmail?: string | null;
  currentPlanId?: string | null;
  isSubscribed?: boolean;
}

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
  const [selectedCrypto, setSelectedCrypto] =
    useState<CryptoOption>("USDT_TRC20");
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

  // ── 1. M-PESA ONLY CHECKOUT (INTASEND) ───────────────────────────────────────
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

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("M-Pesa checkout error:", err);
      setMpesaError(
        err?.message || "Failed to launch M-Pesa checkout. Please try again."
      );
    } finally {
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
    } finally {
      setIsCryptoProcessing(false);
    }
  };

  return (
    <div className="container-app py-10 max-w-5xl space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="badge-pro flex items-center gap-1.5 w-fit mx-auto">
          <Zap className="h-3.5 w-3.5 text-gold-300" />
          SECURE CHECKOUT · M-PESA &amp; CRYPTO
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Complete Your Pro Subscription
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Pay via M-Pesa (Instant STK Push) or pay with 200+ cryptocurrencies via NOWPayments. Both activate your Pro clearance immediately.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Plan selector, Email & M-Pesa / Crypto payment methods (7 cols) */}
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
                    <span className="block text-[11px] font-medium text-slate-400">
                      {p.name}
                    </span>
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

          {/* Account Email Box (Smooth 1-Click Checkout without disabled buttons) */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="checkout-account-email"
                className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5 text-gold-300" />
                <span>Account Email for Instant Activation</span>
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
                  if (mpesaError) setMpesaError(null);
                  if (cryptoError) setCryptoError(null);
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
                : "Enter your email above and choose M-Pesa or Crypto below for instant checkout."}
            </p>
          </div>

          {/* ── OPTION 2: PAY WITH M-PESA ONLY (NO CARD) ───────────────────── */}
          <div className="card p-6 space-y-5 border-bull-400/30 bg-bull-400/[0.02] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-bull-500/15 border border-bull-400/30 flex items-center justify-center text-bull-300">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    2. Pay with M-Pesa (STK Push)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Direct Safaricom M-Pesa Mobile Money Checkout
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-bull-300 flex items-center gap-1 font-semibold bg-bull-400/10 border border-bull-400/20 px-2.5 py-1 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                Instant STK Push
              </span>
            </div>

            {/* M-Pesa Badges Only (No Card Badges) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-lg border border-bull-400/30 bg-bull-400/15 px-3 py-1 text-xs font-bold text-bull-200 tracking-wider">
                M-PESA EXPRESS (STK Push)
              </span>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                Safaricom M-Pesa
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
                <span>M-Pesa Mobile Number (Optional, for auto-fill)</span>
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
                Receive an immediate M-Pesa PIN prompt on your phone to complete your subscription.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant M-Pesa STK Push:</strong> Receive a direct PIN prompt on your Safaricom line with automatic KES conversion.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Delay Clearance:</strong> Account upgrades to Pro institutional access immediately once M-Pesa payment is confirmed.
                </span>
              </div>
            </div>

            {mpesaError && (
              <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{mpesaError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isMpesaProcessing || isCryptoProcessing}
              onClick={handleMpesaCheckout}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-gold cursor-pointer disabled:opacity-50"
              id="intasend-checkout-btn"
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

            <p className="text-center text-[11px] text-slate-400">
              Direct M-Pesa mobile money checkout · Instant Pro activation
            </p>
          </div>

          {/* ── OPTION 3: PAY WITH CRYPTO (NOWPAYMENTS) ────────────────────── */}
          <div className="card p-6 space-y-6 border-gold-400/25">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-gold-300">
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                    3. Pay with Crypto (NOWPayments)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    USDT (TRC20/ERC20), Bitcoin, Ethereum &amp; 200+ Coins
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-gold-300 flex items-center gap-1 font-semibold bg-gold-400/10 border border-gold-400/20 px-2.5 py-1 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                200+ Coins
              </span>
            </div>

            {/* Currency selector buttons */}
            <div className="space-y-2">
              <label className="label">Supported Payment Currencies</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(Object.keys(CRYPTO_CONFIG) as CryptoOption[]).map((key) => {
                  const c = CRYPTO_CONFIG[key];
                  const isSelected = selectedCrypto === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedCrypto(key)}
                      className={`rounded-lg border p-2.5 text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-gold-300 bg-gold-400/10 text-white shadow-gold"
                          : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="block text-xs font-bold">{c.symbol}</span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {c.network.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Crypto Payment Overview */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Estimated Equivalent:
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-display text-xl font-bold text-white tabular">
                      {cryptoAmount} {cryptoInfo.symbol}
                    </span>
                    <span className="text-xs text-slate-400">
                      (${plan.priceUsd}.00 USD)
                    </span>
                  </div>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 block text-[11px]">
                    Target Network:
                  </span>
                  <span className="font-semibold text-gold-300 text-xs mt-0.5 block">
                    {cryptoInfo.network}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dynamic Invoice &amp; QR Code:</strong> A dedicated blockchain invoice and QR code are generated on the NOWPayments page.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                  <span>
                    <strong>200+ Cryptocurrencies Supported:</strong> Accepts USDT (TRC20, ERC20, Polygon), BTC, ETH, SOL, LTC and more.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              {cryptoError && (
                <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{cryptoError}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isCryptoProcessing || isMpesaProcessing}
                onClick={handleCryptoCheckout}
                className="btn-secondary w-full py-3.5 text-sm font-bold cursor-pointer hover:border-gold-300 hover:text-gold-200 disabled:opacity-50"
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

              <p className="text-center text-[11px] text-slate-400">
                Direct hosted crypto invoice · Automatic blockchain confirmation &amp; clearance
              </p>
            </div>
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
                Your clearance activates automatically upon M-Pesa or Crypto confirmation. Cancel or change plan anytime from Account settings.
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
