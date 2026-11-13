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
  Copy,
  ExternalLink,
  Send,
  Clock,
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

const PAYBILL_NUMBER = "919700";
const ACCOUNT_NUMBER = "0018255401";
const SUPPORT_EMAIL = "Support@xauusdtracker.com";
const KES_RATE = 129;

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

interface PaybillSubmissionResult {
  orderId: string;
  reference: string;
  email: string;
  planName: string;
  amountUsd: number;
  amountKes: number;
}

export function CheckoutClient({
  initialPlanId = "monthly",
  userEmail,
}: CheckoutClientProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(initialPlanId);
  const [activePaymentMethod, setActivePaymentMethod] =
    useState<PaymentOption>("mpesa");
  const [selectedCrypto, setSelectedCrypto] =
    useState<CryptoOption>("USDT_TRC20");
  const [checkoutEmail, setCheckoutEmail] = useState<string>(userEmail || "");
  const [mpesaCode, setMpesaCode] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPaybillProcessing, setIsPaybillProcessing] =
    useState<boolean>(false);
  const [paybillError, setPaybillError] = useState<string | null>(null);
  const [submittedPaybill, setSubmittedPaybill] =
    useState<PaybillSubmissionResult | null>(null);

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
  const estimatedKes = Math.round(plan.priceUsd * KES_RATE);
  const cryptoInfo = CRYPTO_CONFIG[selectedCrypto];
  const cryptoAmount = (plan.priceUsd * cryptoInfo.rate).toFixed(
    cryptoInfo.symbol === "USDT" ? 2 : 5
  );

  const handleCopy = (value: string, fieldKey: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2200);
    }
  };

  const buildSupportProofLinks = (submission?: PaybillSubmissionResult | null) => {
    const emailForBody =
      submission?.email ||
      (userEmail || checkoutEmail || "").trim().toLowerCase() ||
      "[Your Account Email]";
    const subject = `Paybill Payment Proof (${PAYBILL_NUMBER}) - ${
      submission?.planName || plan.name
    } - ${emailForBody}`;
    const bodyLines = [
      "Hi XAUUSD Tracker Support,",
      "",
      "I have completed payment via M-Pesa Paybill. Please find my proof of payment attached/below for manual Pro activation:",
      "",
      `Account Email: ${emailForBody}`,
      `Selected Plan: ${submission?.planName || plan.name} ($${
        submission?.amountUsd || plan.priceUsd
      } / ~KES ${(submission?.amountKes || estimatedKes).toLocaleString()})`,
      `Paybill Number: ${PAYBILL_NUMBER}`,
      `Account Number: ${ACCOUNT_NUMBER}`,
      `M-Pesa Confirmation Code / Ref: ${
        submission?.reference || mpesaCode.trim().toUpperCase() || "[Paste M-Pesa SMS / Code]"
      }`,
      `Phone Number Used: ${phoneNumber.trim() || "[Optional]"}`,
      ...(submission?.orderId ? [`Order ID: ${submission.orderId}`] : []),
      "",
      "[Please attach your M-Pesa payment confirmation screenshot before sending]",
    ];
    const body = bodyLines.join("\n");

    return {
      gmailUrl: `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        SUPPORT_EMAIL
      )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      mailtoUrl: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`,
    };
  };

  // ── 1. M-PESA PAYBILL SUBMISSION (MANUAL ADMIN APPROVAL) ───────────────────
  const handlePaybillSubmit = async () => {
    setPaybillError(null);

    const effectiveEmail = (userEmail || checkoutEmail || "")
      .trim()
      .toLowerCase();
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      setPaybillError(
        "Please enter your account email above so our team can activate Pro access on your account after verifying your proof."
      );
      return;
    }

    setIsPaybillProcessing(true);

    try {
      const res = await fetch("/api/checkout/paybill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          email: effectiveEmail,
          mpesaCode: mpesaCode.trim() || undefined,
          phoneNumber: phoneNumber.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to submit your Paybill payment confirmation. Please try again."
        );
      }

      setSubmittedPaybill({
        orderId: data.orderId,
        reference: data.reference,
        email: data.email || effectiveEmail,
        planName: data.planName || plan.name,
        amountUsd: data.amountUsd || plan.priceUsd,
        amountKes: data.amountKes || estimatedKes,
      });
    } catch (err: any) {
      console.error("Paybill submission error:", err);
      setPaybillError(
        err?.message || "Failed to record Paybill submission. Please try again."
      );
    } finally {
      setIsPaybillProcessing(false);
    }
  };

  // ── 2. CRYPTO CHECKOUT (NOWPAYMENTS) ───────────────────────────────────────
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

  const proofLinks = buildSupportProofLinks(submittedPaybill);

  return (
    <div className="container-app py-8 max-w-5xl space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <span className="badge-pro flex items-center gap-1.5 w-fit mx-auto">
          <Zap className="h-3.5 w-3.5 text-gold-300" />
          SECURE CHECKOUT · M-PESA PAYBILL &amp; CRYPTO
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Complete Your Pro Subscription
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Pay via M-Pesa Paybill (<strong className="text-white">919700</strong>) &amp; send proof to support for activation, or pay instantly with 200+ Cryptocurrencies (NOWPayments).
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
                    onClick={() => {
                      setSelectedPlanId(p.id);
                      setSubmittedPaybill(null);
                    }}
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
                <span>2. Account Email for Activation</span>
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
                if (paybillError) setPaybillError(null);
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

          {/* 3. BOTH PAYMENT OPTIONS VISIBLE SIDE-BY-SIDE AT THE SAME TIME */}
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

            {/* Side-by-Side Selector Tabs — Visible Without Scrolling */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActivePaymentMethod("mpesa");
                  if (paybillError) setPaybillError(null);
                }}
                className={`rounded-xl border p-3.5 text-left transition-all cursor-pointer flex items-center gap-2.5 relative ${
                  activePaymentMethod === "mpesa"
                    ? "border-bull-400 bg-bull-400/15 shadow-lg shadow-bull-900/20 ring-1 ring-bull-400"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                }`}
                id="tab-paybill-mpesa"
              >
                <div className="h-8 w-8 rounded-lg bg-bull-500/20 border border-bull-400/30 flex items-center justify-center text-bull-300 shrink-0">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-white truncate">
                    M-Pesa Paybill
                  </span>
                  <span className="block text-[10px] text-bull-300 truncate font-mono">
                    Paybill: {PAYBILL_NUMBER}
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
                id="tab-pay-crypto"
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
            {paybillError && activePaymentMethod === "mpesa" && (
              <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{paybillError}</span>
              </div>
            )}
            {cryptoError && activePaymentMethod === "crypto" && (
              <div className="rounded-lg bg-bear-400/10 border border-bear-400/30 p-3 text-xs text-bear-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{cryptoError}</span>
              </div>
            )}

            {/* Active Method Panel: M-PESA PAYBILL (MANUAL PROOF VERIFICATION) */}
            {activePaymentMethod === "mpesa" && (
              <div className="card p-5 space-y-4 border-bull-400/30 bg-bull-400/[0.02] animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-bull-400/30 bg-bull-400/15 px-2 py-0.5 text-[11px] font-bold text-bull-200">
                      M-PESA PAYBILL
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Lipa na M-Pesa · Manual Support Verification
                    </span>
                  </div>
                  <span className="text-[11px] text-bull-300 font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Send Proof After Paying
                  </span>
                </div>

                {/* Paybill & Account Number Copyable Box */}
                <div className="rounded-xl border border-bull-400/30 bg-ink-900/90 p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Paybill Number */}
                    <div className="rounded-lg border border-white/10 bg-ink-950/80 p-3 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Paybill Number
                        </span>
                        <span
                          className="font-mono text-lg font-extrabold text-bull-300 tracking-wider select-all"
                          id="paybill-number-value"
                        >
                          {PAYBILL_NUMBER}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(PAYBILL_NUMBER, "paybill")}
                        className="btn-secondary px-2.5 py-1.5 text-[11px] shrink-0 flex items-center gap-1 cursor-pointer"
                        id="copy-paybill-btn"
                      >
                        {copiedField === "paybill" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-bull-300" />
                            <span className="text-bull-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Account Number */}
                    <div className="rounded-lg border border-white/10 bg-ink-950/80 p-3 flex items-center justify-between gap-2">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                          Account Number
                        </span>
                        <span
                          className="font-mono text-lg font-extrabold text-gold-300 tracking-wider select-all"
                          id="paybill-account-value"
                        >
                          {ACCOUNT_NUMBER}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(ACCOUNT_NUMBER, "account")}
                        className="btn-secondary px-2.5 py-1.5 text-[11px] shrink-0 flex items-center gap-1 cursor-pointer"
                        id="copy-account-btn"
                      >
                        {copiedField === "account" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-bull-300" />
                            <span className="text-bull-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-xs">
                    <span className="text-slate-300">
                      Amount to Send ({plan.name}):
                    </span>
                    <span className="font-mono font-bold text-white">
                      ${plan.priceUsd}.00 USD{" "}
                      <span className="text-bull-300">
                        (~KES {estimatedKes.toLocaleString()})
                      </span>
                    </span>
                  </div>
                </div>

                {/* Clear Instructions */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3.5 space-y-2 text-xs text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-bull-400/20 text-[10px] font-bold text-bull-300 mt-0.5">
                      1
                    </span>
                    <span>
                      On your phone, go to <strong>M-Pesa → Lipa na M-Pesa → Paybill</strong>, enter Business No. <strong className="font-mono text-white">{PAYBILL_NUMBER}</strong> and Account No. <strong className="font-mono text-white">{ACCOUNT_NUMBER}</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-bull-400/20 text-[10px] font-bold text-bull-300 mt-0.5">
                      2
                    </span>
                    <span>
                      Enter your M-Pesa confirmation code below and submit, then <strong>send your payment proof screenshot to {SUPPORT_EMAIL}</strong> so our team activates your Pro access.
                    </span>
                  </div>
                </div>

                {submittedPaybill ? (
                  /* Post-submission state: Recorded in Admin Queue + One-Click Email Proof to Support */
                  <div
                    className="rounded-xl border border-bull-400/40 bg-bull-500/10 p-4 space-y-4 animate-fade-in"
                    id="paybill-submitted-card"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-xl bg-bull-400/20 border border-bull-400/40 flex items-center justify-center text-bull-300 shrink-0">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-white">
                          Payment Request Recorded — Send Proof to Support
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Your request for <strong className="text-white">{submittedPaybill.email}</strong> ({submittedPaybill.planName}) is now queued for admin approval. Send your M-Pesa confirmation screenshot to{" "}
                          <strong className="text-gold-300">{SUPPORT_EMAIL}</strong> to activate immediately.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-ink-950/80 p-3 text-[11px] font-mono space-y-1.5">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Order Reference:</span>
                        <span className="text-white font-semibold select-all">
                          {submittedPaybill.orderId}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Submitted Proof Ref:</span>
                        <span className="text-bull-300 font-semibold select-all">
                          {submittedPaybill.reference}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">Support Inbox:</span>
                        <span className="text-gold-300 font-semibold select-all">
                          {SUPPORT_EMAIL}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <a
                        href={proofLinks.gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full py-3 text-xs sm:text-sm font-bold shadow-gold flex items-center justify-center gap-2"
                        id="send-proof-gmail-btn"
                      >
                        <Send className="h-4 w-4" />
                        <span>Send Proof via Gmail ({SUPPORT_EMAIL})</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={proofLinks.mailtoUrl}
                          className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5"
                          id="send-proof-mailto-btn"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Default Mail App</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopy(SUPPORT_EMAIL, "support-email")}
                          className="btn-secondary py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          id="copy-support-email-checkout-btn"
                        >
                          {copiedField === "support-email" ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-bull-300" />
                              <span className="text-bull-300">Email Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Support Email</span>
                            </>
                          )}
                        </button>
                      </div>

                      <Link
                        href={`/payment/status?order_id=${encodeURIComponent(
                          submittedPaybill.orderId
                        )}&provider=paybill`}
                        className="btn-ghost w-full py-2 text-xs text-bull-300 hover:text-white flex items-center justify-center gap-1.5"
                        id="track-paybill-status-link"
                      >
                        <span>Track Approval Status Page</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Pre-submission inputs & CTA */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="paybill_mpesa_code"
                          className="text-xs font-medium text-slate-300 block"
                        >
                          M-Pesa Code / Reference (Optional)
                        </label>
                        <input
                          id="paybill_mpesa_code"
                          name="paybill_mpesa_code"
                          type="text"
                          value={mpesaCode}
                          onChange={(e) => setMpesaCode(e.target.value)}
                          placeholder="e.g. SJK8X92P1M"
                          className="w-full rounded-xl border border-white/15 bg-ink-850 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-bull-400 focus:outline-none focus:ring-1 focus:ring-bull-400 font-mono uppercase"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="mpesa_mobile_number"
                          className="text-xs font-medium text-slate-300 block"
                        >
                          Phone Number Used (Optional)
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
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isPaybillProcessing}
                      onClick={handlePaybillSubmit}
                      className="btn-primary w-full py-3 text-sm font-bold shadow-gold cursor-pointer disabled:opacity-50"
                      id="paybill-submit-btn"
                    >
                      {isPaybillProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Recording Payment Proof...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            I Have Paid — Submit &amp; Send Proof to Support
                          </span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {/* Direct Support Proof Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[11px]">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-gold-300 shrink-0" />
                        <span>
                          Support Proof Email:{" "}
                          <strong className="text-gold-300 font-mono select-all">
                            {SUPPORT_EMAIL}
                          </strong>
                        </span>
                      </span>
                      <a
                        href={proofLinks.gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-bull-300 hover:text-bull-200 font-semibold inline-flex items-center gap-1"
                        id="direct-support-proof-gmail-link"
                      >
                        <span>Email Proof in Gmail</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </>
                )}
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
                <span>Fast Account Activation</span>
              </div>
              <p>
                Crypto activates automatically on confirmation. M-Pesa Paybill (<strong className="text-slate-200">{PAYBILL_NUMBER}</strong>) activates promptly once you send your proof to{" "}
                <strong className="text-slate-200">{SUPPORT_EMAIL}</strong>.
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
