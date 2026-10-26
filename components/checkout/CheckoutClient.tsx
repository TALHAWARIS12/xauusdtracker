"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import { PRICING_PLANS, getPlanById, PlanTier } from "@/lib/plan-config";

interface CheckoutClientProps {
  initialPlanId?: string;
  userEmail?: string | null;
  currentPlanId?: string | null;
  isSubscribed?: boolean;
}

type PaymentTab = "card" | "crypto";
type CryptoOption = "USDT_TRC20" | "USDT_ERC20" | "BTC" | "ETH";

const CRYPTO_CONFIG: Record<
  CryptoOption,
  { name: string; symbol: string; network: string; address: string; rate: number }
> = {
  USDT_TRC20: {
    name: "Tether USD",
    symbol: "USDT",
    network: "TRON (TRC20)",
    address: "TYDzsXDvG5Fpn5v7HpnN8J3Cvhv941RzN",
    rate: 1.0,
  },
  USDT_ERC20: {
    name: "Tether USD",
    symbol: "USDT",
    network: "Ethereum (ERC20)",
    address: "0x71C94B34A8dcf776317b9b71B62C0B9156F88E2",
    rate: 1.0,
  },
  BTC: {
    name: "Bitcoin",
    symbol: "BTC",
    network: "Bitcoin Native SegWit",
    address: "bc1q9v7w0p2e6p3m5j8u8w4r1y9t7z0v2k4x6m8q",
    rate: 0.000011, // ~90k BTC
  },
  ETH: {
    name: "Ethereum",
    symbol: "ETH",
    network: "Ethereum Mainnet",
    address: "0x9E82A13f70B83E58F49Ff2b4A24E913c72620A5",
    rate: 0.00034, // ~2.9k ETH
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
  const [activeTab, setActiveTab] = useState<PaymentTab>("card");
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoOption>("USDT_TRC20");
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isNowPaymentsProcessing, setIsNowPaymentsProcessing] = useState<boolean>(false);
  const [nowPaymentsError, setNowPaymentsError] = useState<string | null>(null);

  // Clean up any stale cookies on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sandbox_pro");
      document.cookie = "sandbox_pro=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "pro_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, []);

  // Card Form State
  const [cardNumber, setCardNumber] = useState<string>("4242 • 4242 • 4242 • 4242");
  const [cardExpiry, setCardExpiry] = useState<string>("12/28");
  const [cardCvc, setCardCvc] = useState<string>("123");
  const [cardholderName, setCardholderName] = useState<string>(
    userEmail ? userEmail.split("@")[0].toUpperCase() : "JOHN DOE"
  );

  const plan: PlanTier = getPlanById(selectedPlanId);
  const cryptoInfo = CRYPTO_CONFIG[selectedCrypto];
  const cryptoAmount = (plan.priceUsd * cryptoInfo.rate).toFixed(
    cryptoInfo.symbol === "USDT" ? 2 : 5
  );

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(cryptoInfo.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      // Redirect directly to live NOWPayments checkout invoice
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      console.error("NOWPayments checkout error:", err);
      setNowPaymentsError(err?.message || "Failed to launch crypto checkout.");
    } finally {
      setIsNowPaymentsProcessing(false);
    }
  };

  const handleCompletePayment = async (method: "CARD" | "CRYPTO") => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/checkout/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: method,
          currency: method === "CRYPTO" ? cryptoInfo.symbol : "USD",
        }),
      });

      if (res.status === 401) {
        router.push(`/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`);
        return;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Sandbox payment failed.");
      }

      // Clean up legacy cookies
      if (typeof window !== "undefined") {
        localStorage.removeItem("sandbox_pro");
        document.cookie = "sandbox_pro=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie = "pro_access=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      // Hard redirect to /dashboard?payment=success to guarantee server components re-evaluate fresh subscription state
      window.location.href = "/dashboard?payment=success";
    } catch (err: any) {
      console.error("Payment error:", err);
      alert(err?.message || "Payment simulation failed. Please ensure you are logged in.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-app py-10 max-w-5xl space-y-8">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="badge-pro">
          <Sparkles className="h-3 w-3" />
          SANDBOX CHECKOUT
        </span>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Complete Your Subscription
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Test mode active · Select your plan interval and payment method to instantly unlock Pro access.
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

          {/* Payment Method Selector Tabs */}
          <div className="card p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                2. Choose Payment Method
              </h2>
              <span className="text-[11px] text-bull-300 flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                256-Bit SSL Secured
              </span>
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl border border-white/10 bg-ink-850 p-1">
              <button
                type="button"
                onClick={() => setActiveTab("card")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "card"
                    ? "bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950 shadow-gold"
                    : "text-slate-300 hover:text-white"
                }`}
                id="checkout-tab-card"
              >
                <CreditCard className="h-4 w-4" />
                <span>Credit / Debit Card (Stripe Test)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("crypto")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "crypto"
                    ? "bg-gradient-to-r from-gold-300 to-gold-500 text-ink-950 shadow-gold"
                    : "text-slate-300 hover:text-white"
                }`}
                id="checkout-tab-crypto"
              >
                <QrCode className="h-4 w-4" />
                <span>Cryptocurrency (USDT/BTC/ETH)</span>
              </button>
            </div>

            {/* TAB 1: CARD CHECKOUT */}
            {activeTab === "card" && (
              <div className="space-y-4 animate-fade-in" id="card-checkout-form">
                {/* MANDATORY UI HELPER BOX */}
                <div
                  className="rounded-xl border border-gold-300/40 bg-gold-400/10 p-4 text-xs space-y-1 text-gold-100"
                  id="stripe-testing-helper-box"
                >
                  <div className="flex items-center gap-1.5 font-bold text-gold-300">
                    <Info className="h-4 w-4 shrink-0" />
                    <span>Testing Mode Active:</span>
                  </div>
                  <p className="font-mono text-slate-200 pl-5.5 text-[11px] select-all">
                    Use card number <strong>4242 • 4242 • 4242 • 4242</strong> | Exp: <strong>12/28</strong> | CVC: <strong>123</strong>
                  </p>
                </div>

                {!userEmail && (
                  <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200 flex items-center justify-between">
                    <span>You are not signed in. Sign in to link access to your account.</span>
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`}
                      className="font-bold underline text-amber-300 hover:text-white shrink-0 ml-2"
                    >
                      Sign In →
                    </Link>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="label">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="input uppercase"
                      placeholder="JOHN DOE"
                    />
                  </div>

                  <div>
                    <label className="label">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="input font-mono tabular pl-10"
                        placeholder="4242 4242 4242 4242"
                      />
                      <CreditCard className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Expiration Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="input font-mono tabular text-center"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="label">CVC / CVV</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="input font-mono tabular text-center"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleCompletePayment("CARD")}
                    className="btn-primary w-full py-3 text-sm font-semibold shadow-gold cursor-pointer"
                    id="complete-card-payment-btn"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-ink-950" />
                        <span>Processing Test Payment...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Card Payment (${plan.priceUsd})</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    Instant sandbox confirmation · No real funds charged
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: CRYPTO CHECKOUT */}
            {activeTab === "crypto" && (
              <div className="space-y-4 animate-fade-in" id="crypto-checkout-form">
                {/* Currency selector buttons */}
                <div>
                  <label className="label">Select Asset & Network</label>
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

                {/* Crypto Payment Modal / Box */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Mock QR Code */}
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white p-2 shadow-card">
                      <svg
                        viewBox="0 0 100 100"
                        className="h-full w-full"
                        aria-label="Payment QR Code"
                      >
                        <rect width="100" height="100" fill="#ffffff" />
                        {/* QR Corners */}
                        <rect x="10" y="10" width="24" height="24" fill="#06080F" />
                        <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
                        <rect x="18" y="18" width="8" height="8" fill="#06080F" />

                        <rect x="66" y="10" width="24" height="24" fill="#06080F" />
                        <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
                        <rect x="74" y="18" width="8" height="8" fill="#06080F" />

                        <rect x="10" y="66" width="24" height="24" fill="#06080F" />
                        <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
                        <rect x="18" y="74" width="8" height="8" fill="#06080F" />

                        {/* QR Matrix Dots */}
                        <rect x="42" y="14" width="6" height="6" fill="#06080F" />
                        <rect x="52" y="14" width="6" height="6" fill="#06080F" />
                        <rect x="46" y="26" width="6" height="6" fill="#06080F" />
                        <rect x="42" y="42" width="16" height="16" fill="#F2B93B" rx="3" />
                        <rect x="14" y="44" width="6" height="6" fill="#06080F" />
                        <rect x="24" y="48" width="6" height="6" fill="#06080F" />
                        <rect x="68" y="44" width="6" height="6" fill="#06080F" />
                        <rect x="78" y="52" width="6" height="6" fill="#06080F" />
                        <rect x="44" y="68" width="6" height="6" fill="#06080F" />
                        <rect x="56" y="74" width="6" height="6" fill="#06080F" />
                        <rect x="68" y="68" width="8" height="8" fill="#06080F" />
                        <rect x="80" y="76" width="6" height="6" fill="#06080F" />
                      </svg>
                    </div>

                    <div className="flex-1 space-y-2 text-xs w-full">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Send Exactly:</span>
                        <span className="font-display text-lg font-bold text-white tabular">
                          {cryptoAmount} {cryptoInfo.symbol}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1.5">
                          (${plan.priceUsd}.00 USD)
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Network:</span>
                        <span className="font-semibold text-gold-300">
                          {cryptoInfo.network}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Deposit Address:</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <code className="flex-1 rounded-md bg-ink-850 px-2.5 py-1.5 text-[11px] text-slate-200 border border-white/10 font-mono truncate">
                            {cryptoInfo.address}
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyAddress}
                            className="btn-secondary px-2 py-1.5 text-xs shrink-0 cursor-pointer"
                            title="Copy deposit address"
                          >
                            {copied ? <Check className="h-3.5 w-3.5 text-bull-300" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-gold-400/10 border border-gold-300/30 p-3 text-[11px] text-gold-200 flex items-start gap-2">
                    <Zap className="h-4 w-4 text-gold-300 shrink-0 mt-0.5" />
                    <span>
                      <strong>NOWPayments Live Gateway Connected:</strong> Accepts USDT, BTC, ETH, SOL, LTC and 200+ coins. Click below to launch the hosted crypto payment page.
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  {nowPaymentsError && (
                    <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300">
                      {nowPaymentsError}
                    </div>
                  )}

                  {/* Primary: Live NOWPayments Checkout */}
                  <button
                    type="button"
                    disabled={isNowPaymentsProcessing || isProcessing}
                    onClick={handleNowPaymentsCheckout}
                    className="btn-primary w-full py-3.5 text-sm font-bold shadow-gold cursor-pointer"
                    id="nowpayments-checkout-btn"
                  >
                    {isNowPaymentsProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-ink-950" />
                        <span>Connecting to NOWPayments Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Pay with Crypto via NOWPayments (${plan.priceUsd})</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-slate-400">
                    Direct hosted checkout · Automatic blockchain confirmation & clearance
                  </p>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/[0.06]"></div>
                    <span className="flex-shrink mx-3 text-[10px] uppercase text-slate-500 font-mono">
                      or developer test mode
                    </span>
                    <div className="flex-grow border-t border-white/[0.06]"></div>
                  </div>

                  {/* Secondary: Sandbox Simulation */}
                  <button
                    type="button"
                    disabled={isProcessing || isNowPaymentsProcessing}
                    onClick={() => handleCompletePayment("CRYPTO")}
                    className="btn-secondary w-full py-2.5 text-xs font-semibold text-slate-300 cursor-pointer"
                    id="simulate-crypto-payment-btn"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Simulating Test Confirmation...</span>
                      </>
                    ) : (
                      <span>Simulate Offline Sandbox Confirmation</span>
                    )}
                  </button>
                </div>
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
                Your clearance activates immediately upon test completion. Cancel or change plan anytime from Account settings.
              </p>
            </div>

            <div className="pt-1">
              <Link
                href="/pricing"
                className="btn-ghost w-full text-xs text-slate-400 hover:text-white"
              >
                ‹ View All Plans & Comparison
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
