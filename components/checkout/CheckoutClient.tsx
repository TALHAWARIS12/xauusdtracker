"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Loader2,
  Coins,
  CreditCard,
  AlertTriangle,
  Smartphone,
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
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>("USDT_TRC20");

  // IntaSend (M-Pesa & Card) state
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [isIntaSendProcessing, setIsIntaSendProcessing] = useState<boolean>(false);
  const [intaSendError, setIntaSendError] = useState<string | null>(null);

  // NOWPayments crypto state
  const [isNowPaymentsProcessing, setIsNowPaymentsProcessing] = useState<boolean>(false);
  const [nowPaymentsError, setNowPaymentsError] = useState<string | null>(null);

  // Clean up any stale legacy cookies on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sandbox_pro");
      document.cookie = "sandbox_pro=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "pro_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, []);

  const plan: PlanTier = getPlanById(selectedPlanId);
  const cryptoInfo = CRYPTO_CONFIG[selectedCrypto];
  const cryptoAmount = (plan.priceUsd * cryptoInfo.rate).toFixed(
    cryptoInfo.symbol === "USDT" ? 2 : 5
  );

  // ── IntaSend M-Pesa & Card Checkout ──────────────────────────────────────────
  const handleIntaSendCheckout = async () => {
    setIsIntaSendProcessing(true);
    setIntaSendError(null);
    try {
      // Validate that user didn't accidentally enter an email into phone number field
      const cleanPhone =
        phoneNumber && !phoneNumber.includes("@") && phoneNumber.replace(/\D/g, "").length >= 9
          ? phoneNumber.trim()
          : undefined;

      const res = await fetch("/api/checkout/intasend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          phoneNumber: cleanPhone,
        }),
      });

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to initialize IntaSend checkout.");
      }

      // Redirect to IntaSend hosted payment page
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("IntaSend checkout error:", err);
      setIntaSendError(err?.message || "Failed to launch M-Pesa / Card checkout. Please try again.");
    } finally {
      setIsIntaSendProcessing(false);
    }
  };

  // ── NOWPayments Crypto Checkout ──────────────────────────────────────────────
  const handleNowPaymentsCheckout = async () => {
    setIsNowPaymentsProcessing(true);
    setNowPaymentsError(null);
    try {
      const res = await fetch("/api/checkout/nowpayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id }),
      });

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Failed to initialize NOWPayments checkout session.");
      }

      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("NOWPayments checkout error:", err);
      setNowPaymentsError(err?.message || "Failed to launch crypto checkout.");
    } finally {
      setIsNowPaymentsProcessing(false);
    }
  };

  return (
    <div className="container-app py-10 max-w-5xl space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="badge-pro flex items-center gap-1.5 w-fit mx-auto">
          <Zap className="h-3.5 w-3.5 text-gold-300" />
          SECURE CHECKOUT · M-PESA, CARDS &amp; CRYPTO
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Complete Your Pro Subscription
        </h1>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          Pay via M-Pesa or Card using IntaSend, or pay with 200+ cryptocurrencies via NOWPayments. Both activate your Pro clearance instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Plan selector & payment methods (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Plan Interval Picker */}
          <div className="card p-5 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              1. Select Plan Interval
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

          {/* Sign-in warning */}
          {!userEmail && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200 flex items-center justify-between">
              <span>You are not signed in. Sign in to link your subscription to your account.</span>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`}
                className="font-bold underline text-amber-300 hover:text-white shrink-0 ml-2"
              >
                Sign In →
              </Link>
            </div>
          )}

          {/* ── INTASEND M-PESA & CARD PAYMENT (PRIMARY) ─────────────────── */}
          <div className="card p-6 space-y-5 border-bull-400/30 bg-bull-400/[0.02] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-bull-300" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                  2. Pay with M-Pesa or Card (IntaSend)
                </h2>
              </div>
              <span className="text-[11px] text-bull-300 flex items-center gap-1 font-medium bg-bull-400/10 border border-bull-400/20 px-2 py-0.5 rounded-full">
                <ShieldCheck className="h-3.5 w-3.5" />
                Recommended
              </span>
            </div>

            {/* Accepted Rails Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded border border-bull-400/30 bg-bull-400/10 px-2.5 py-1 text-[11px] font-bold text-bull-200 tracking-wider">
                M-PESA (STK Push)
              </span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-300 tracking-wider">
                VISA
              </span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-300 tracking-wider">
                Mastercard
              </span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-300 tracking-wider">
                Airtel Money
              </span>
              <span className="rounded border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-300 tracking-wider">
                PesaLink
              </span>
            </div>

            {/* Optional Phone Number Input */}
            <div className="space-y-1.5">
              <label htmlFor="mpesa_mobile_number" className="text-[11px] font-medium text-slate-300 flex items-center justify-between">
                <span>M-Pesa Mobile Number (Optional, for auto-fill)</span>
                <span className="text-[10px] text-slate-500">e.g. 0712345678 or 254...</span>
              </label>
              <input
                id="mpesa_mobile_number"
                name="mpesa_mobile_number"
                type="tel"
                autoComplete="off"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712 345 678"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-bull-400 focus:outline-none focus:ring-1 focus:ring-bull-400 font-mono"
              />
              <p className="text-[10px] text-slate-400">
                If provided, IntaSend will automatically prefill your M-Pesa prompt for direct PIN verification.
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-2 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Instant M-Pesa STK Push:</strong> Select M-Pesa on the checkout page to receive an immediate PIN prompt on your Safaricom line.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Debit / Credit Cards:</strong> Also accepts Visa and Mastercard via 3D-Secure encrypted processing.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-bull-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero-Delay Clearance:</strong> Account upgrades to Pro institutional access immediately once payment is confirmed.
                </span>
              </div>
            </div>

            {intaSendError && (
              <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {intaSendError}
              </div>
            )}

            <button
              type="button"
              disabled={isIntaSendProcessing || !userEmail}
              onClick={handleIntaSendCheckout}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-gold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              id="intasend-checkout-btn"
            >
              {isIntaSendProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting to IntaSend...</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4" />
                  <span>Pay with M-Pesa / Card (${plan.priceUsd})</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Secure IntaSend checkout · Multi-currency KES/USD · Instant activation
            </p>
          </div>

          {/* ── NOWPAYMENTS CRYPTO PAYMENT (SECONDARY) ──────────────────── */}
          <div className="card p-6 space-y-6 opacity-95">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-gold-300" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
                  3. Pay with Crypto (NOWPayments)
                </h2>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
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
                  <span className="text-slate-400 block text-[11px]">Estimated Equivalent:</span>
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
                  <span className="text-slate-400 block text-[11px]">Target Network:</span>
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
              {nowPaymentsError && (
                <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300">
                  {nowPaymentsError}
                </div>
              )}

              <button
                type="button"
                disabled={isNowPaymentsProcessing || !userEmail}
                onClick={handleNowPaymentsCheckout}
                className="btn-secondary w-full py-3.5 text-sm font-bold cursor-pointer hover:border-gold-300 hover:text-gold-200 disabled:opacity-50 disabled:cursor-not-allowed"
                id="nowpayments-checkout-btn"
              >
                {isNowPaymentsProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-ink-950" />
                    <span>Connecting to NOWPayments Gateway...</span>
                  </>
                ) : (
                  <>
                    <Coins className="h-4 w-4" />
                    <span>Pay with Crypto via NOWPayments (${plan.priceUsd})</span>
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
                Your clearance activates automatically upon payment confirmation — M-Pesa, card, or crypto. Cancel or change plan anytime from Account settings.
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
