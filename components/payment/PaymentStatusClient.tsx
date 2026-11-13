"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
} from "lucide-react";

interface PaymentStatusClientProps {
  initialOrderId?: string | null;
  urlStatus?: string | null;
  initialInvoiceId?: string | null;
  initialProvider?: string | null;
}

type DisplayState = "LOADING" | "SUCCESS" | "PENDING" | "FAILED";

interface TransactionDetails {
  orderId?: string;
  amount?: number;
  currency?: string;
  status?: string;
  provider?: string;
  confirmedAt?: string | null;
  isSubscribed?: boolean;
}

export function PaymentStatusClient({
  initialOrderId,
  urlStatus,
  initialInvoiceId,
  initialProvider,
}: PaymentStatusClientProps) {
  const [orderId, setOrderId] = useState<string | null>(initialOrderId || null);
  const [invoiceId, setInvoiceId] = useState<string | null>(initialInvoiceId || null);
  const [provider, setProvider] = useState<string | null>(initialProvider || null);
  const [displayState, setDisplayState] = useState<DisplayState>(() => {
    if (urlStatus === "cancelled") return "FAILED";
    return "LOADING";
  });
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Client-side URL param fallback on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlCheckoutId = searchParams.get("checkout_id") || searchParams.get("checkoutId");
      const urlInvoiceId = searchParams.get("invoice_id") || searchParams.get("invoiceId");
      const urlOrderId = searchParams.get("order_id") || searchParams.get("orderId");
      const urlApiRef = searchParams.get("api_ref");
      const urlTrackingId = searchParams.get("tracking_id");
      const primaryId = urlCheckoutId || urlOrderId || urlApiRef || urlTrackingId;
      if (!orderId && primaryId) {
        setOrderId(primaryId);
      }
      if (!invoiceId && urlInvoiceId) {
        setInvoiceId(urlInvoiceId);
      }
      if (!provider && (urlCheckoutId || urlInvoiceId || urlApiRef || urlTrackingId)) {
        setProvider("intasend");
      }
    }
  }, [orderId, invoiceId, provider]);

  const fetchStatus = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (orderId) {
        queryParams.set("order_id", orderId);
      }
      if (invoiceId) {
        queryParams.set("invoice_id", invoiceId);
      }
      const queryStr = queryParams.toString();
      const res = await fetch(`/api/payment/status${queryStr ? `?${queryStr}` : ""}`);

      if (!res.ok) {
        if (res.status === 404 && urlStatus === "cancelled") {
          setDisplayState("FAILED");
          return;
        }
        setDisplayState("PENDING");
        return;
      }

      const data = await res.json();
      setDetails(data);

      if (data.status === "COMPLETED" || data.isSubscribed) {
        setDisplayState("SUCCESS");
      } else if (
        data.status === "FAILED" ||
        data.status === "REFUNDED" ||
        urlStatus === "cancelled"
      ) {
        setDisplayState("FAILED");
      } else {
        setDisplayState("PENDING");
      }
    } catch (err) {
      console.error("Failed to query payment status:", err);
      if (urlStatus === "cancelled") {
        setDisplayState("FAILED");
      } else {
        setDisplayState("PENDING");
      }
    }
  }, [orderId, invoiceId, urlStatus]);

  // Initial fetch and automatic polling
  useEffect(() => {
    fetchStatus();

    const interval = setInterval(() => {
      setPollCount((prev) => {
        if (prev < 100) {
          fetchStatus();
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatus();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const isPaybill =
    details?.provider === "PAYBILL" ||
    details?.provider === "MANUAL" ||
    provider === "paybill" ||
    provider === "PAYBILL";

  const isIntaSend =
    !isPaybill &&
    (details?.provider === "INTASEND" ||
      provider === "intasend" ||
      provider === "INTASEND");

  const paybillProofGmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    "Support@xauusdtracker.com"
  )}&su=${encodeURIComponent(
    `Paybill Payment Proof (919700) - Order ${orderId || details?.orderId || ""}`
  )}&body=${encodeURIComponent(
    `Hi XAUUSD Tracker Support,\n\nI have completed M-Pesa Paybill payment (Paybill: 919700, Account: 0018255401).\nOrder Reference: ${
      orderId || details?.orderId || "[Order ID]"
    }\nPlease find my payment proof attached for Pro activation.\n\nAccount Email: `
  )}`;

  return (
    <div className="container-app py-12 max-w-2xl" id="payment-status-container">
      {/* Outer Card with Glassmorphic Accent */}
      <div className="card overflow-hidden p-8 sm:p-10 space-y-8 border-white/10 shadow-glow">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <span className="badge-pro">
              <Sparkles className="h-3 w-3" />
              {isPaybill
                ? "M-PESA PAYBILL 919700"
                : isIntaSend
                ? "INTASEND M-PESA GATEWAY"
                : "NOWPAYMENTS GATEWAY"}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-bull-300" />
            {isPaybill
              ? "Manual Support Verification"
              : isIntaSend
              ? "Verified Mobile Money Rail"
              : "Verified Cryptographic Channel"}
          </span>
        </div>

        {/* 1. STATE: SUCCESS / ACTIVATED */}
        {displayState === "SUCCESS" && (
          <div className="text-center space-y-6 animate-fade-in" id="payment-status-success">
            {/* Success Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-bull-400/10 border border-bull-400/30 text-bull-300 shadow-glow">
              <CheckCircle2 className="h-10 w-10 animate-bounce" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Payment Confirmed! Your subscription is now active.
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Your payment has been verified. Institutional clearance has been granted with zero-delay live gold liquidity and algorithmic signals.
              </p>
            </div>

            {/* Transaction Receipt Box */}
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-left text-xs space-y-3 font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>Order Reference:</span>
                <span className="text-white font-semibold select-all">
                  {orderId || details?.orderId || "N/A"}
                </span>
              </div>
              {details?.amount && (
                <div className="flex justify-between items-center text-slate-400">
                  <span>Amount Settled:</span>
                  <span className="text-gold-300 font-bold tabular">
                    ${details.amount.toFixed(2)} {details.currency || "USD"}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-400">
                <span>Clearance Status:</span>
                <span className="inline-flex items-center gap-1 text-bull-300 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  PRO ACTIVE
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/terminal"
                className="btn-primary py-3 text-sm font-semibold shadow-gold"
                id="btn-open-terminal"
              >
                <Zap className="h-4 w-4" />
                <span>Launch Terminal</span>
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary py-3 text-sm font-semibold"
                id="btn-open-dashboard"
              >
                <span>Account Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 2. STATE: PENDING / CONFIRMING */}
        {(displayState === "PENDING" || displayState === "LOADING") && (
          <div className="text-center space-y-6 animate-fade-in" id="payment-status-pending">
            {/* Pulsing Pending Icon */}
            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gold-400/10 border border-gold-300/30 text-gold-300 shadow-gold">
              <Clock className="h-10 w-10 animate-pulse" />
              <div className="absolute inset-0 rounded-3xl border border-gold-400/20 animate-ping opacity-30" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {isPaybill
                  ? "Paybill proof received. Awaiting admin verification..."
                  : isIntaSend
                  ? "Payment in progress. Waiting for confirmation..."
                  : "Payment detected. Waiting for blockchain confirmation..."}
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                {isPaybill
                  ? "If you haven't emailed your M-Pesa Paybill (919700 / Acc: 0018255401) screenshot yet, send it to Support@xauusdtracker.com. Once an admin approves your proof, your Pro access activates immediately."
                  : isIntaSend
                  ? "Please check your phone for the M-Pesa PIN prompt if you haven't authorized it yet. Your institutional clearance will unlock automatically once confirmed."
                  : "We are actively listening for network confirmations on your deposit. Your institutional clearance will unlock automatically the instant block confirmations are reached."}
              </p>
              {isPaybill && (
                <div className="pt-2">
                  <a
                    href={paybillProofGmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold shadow-gold"
                    id="status-send-proof-gmail-btn"
                  >
                    <span>Send Proof to Support@xauusdtracker.com</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Live Polling Status Indicator */}
            <div className="rounded-xl border border-gold-400/20 bg-gold-400/5 p-4 text-xs text-gold-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw
                  className={`h-4 w-4 text-gold-300 ${
                    isRefreshing ? "animate-spin" : "animate-spin-slow"
                  }`}
                />
                <span className="font-medium">
                  Auto-checking status every 3s (Check #{pollCount + 1})...
                </span>
              </div>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="btn-ghost px-2 py-1 text-[11px] text-gold-300 hover:text-white"
                id="btn-manual-refresh"
              >
                Refresh Now
              </button>
            </div>

            {/* Transaction Metadata */}
            {(orderId || details?.orderId) && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Tracking Reference:</span>
                  <span className="text-slate-200 select-all">
                    {orderId || details?.orderId}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="text-gold-300 font-semibold uppercase">
                    Awaiting Final Confirmation
                  </span>
                </div>
              </div>
            )}

            {/* Helpful reassurance info */}
            <div className="text-[11px] text-slate-500 max-w-sm mx-auto">
              You may safely leave this window open or return later; your subscription will activate in the background once confirmed.
            </div>
          </div>
        )}

        {/* 3. STATE: FAILED / EXPIRED */}
        {displayState === "FAILED" && (
          <div className="text-center space-y-6 animate-fade-in" id="payment-status-failed">
            {/* Failed Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-bear-400/10 border border-bear-400/30 text-bear-300 shadow-glow">
              <XCircle className="h-10 w-10" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Payment failed or expired. Please try again.
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                The transaction was cancelled, expired, or failed verification. No funds have been deducted from your subscription account.
              </p>
            </div>

            {(orderId || details?.orderId) && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Order Reference:</span>
                  <span className="text-slate-300">{orderId || details?.orderId}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Outcome:</span>
                  <span className="text-bear-300 font-semibold uppercase">
                    Session Cancelled / Expired
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/pricing"
                className="btn-primary py-3 text-sm font-semibold shadow-gold"
                id="btn-retry-pricing"
              >
                <Layers className="h-4 w-4" />
                <span>Choose Another Plan</span>
              </Link>
              <Link
                href="/checkout"
                className="btn-secondary py-3 text-sm font-semibold"
                id="btn-return-checkout"
              >
                <span>Return to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
