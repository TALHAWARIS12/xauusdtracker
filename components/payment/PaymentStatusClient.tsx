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
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";

interface PaymentStatusClientProps {
  initialOrderId?: string | null;
  urlStatus?: string | null;
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
}: PaymentStatusClientProps) {
  const [orderId] = useState<string | null>(initialOrderId || null);
  const [displayState, setDisplayState] = useState<DisplayState>(() => {
    if (urlStatus === "cancelled") return "FAILED";
    return "LOADING";
  });
  const [details, setDetails] = useState<TransactionDetails | null>(null);
  const [pollCount, setPollCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    if (!orderId) {
      if (urlStatus === "cancelled") {
        setDisplayState("FAILED");
      } else {
        // Without an order reference, NEVER claim success - keep as pending verification
        setDisplayState("PENDING");
      }
      return;
    }

    try {
      const res = await fetch(`/api/payment/status?order_id=${encodeURIComponent(orderId)}`);
      if (!res.ok) {
        if (res.status === 404 && urlStatus === "cancelled") {
          setDisplayState("FAILED");
          return;
        }
        // If not found yet but recently created, treat as pending verification
        setDisplayState("PENDING");
        return;
      }

      const data = await res.json();
      setDetails(data);

      // STRICT GATE: Only show SUCCESS if database explicitly confirms transaction is COMPLETED
      if (data.status === "COMPLETED") {
        setDisplayState("SUCCESS");
      } else if (data.status === "FAILED" || data.status === "REFUNDED" || urlStatus === "cancelled") {
        setDisplayState("FAILED");
      } else {
        // Any intermediate status (waiting, confirming, sending, pending) remains in PENDING state
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
  }, [orderId, urlStatus]);

  // Initial fetch and automatic polling for pending blockchain transactions
  useEffect(() => {
    fetchStatus();

    // Only set up polling if state is pending or initial loading
    const interval = setInterval(() => {
      setPollCount((prev) => {
        // Poll for up to 100 iterations (~5 minutes)
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

  return (
    <div className="container-app py-12 max-w-2xl" id="payment-status-container">
      {/* Outer Card with Glassmorphic Accent */}
      <div className="card overflow-hidden p-8 sm:p-10 space-y-8 border-white/10 shadow-glow">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <span className="badge-pro">
              <Sparkles className="h-3 w-3" />
              NOWPAYMENTS GATEWAY
            </span>
          </div>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-bull-300" />
            Verified Cryptographic Channel
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
                Your blockchain transaction has been verified. Institutional clearance has been granted with zero-delay live gold liquidity and proprietary algorithmic signals.
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
                Payment detected. Waiting for blockchain confirmation...
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                We are actively listening for network confirmations on your deposit. Your institutional clearance will unlock automatically the instant block confirmations are reached.
              </p>
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
                  Auto-checking ledger every 3s (Check #{pollCount + 1})...
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
            {orderId && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Tracking Order ID:</span>
                  <span className="text-slate-200 select-all">{orderId}</span>
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
                The crypto transaction was cancelled, expired, or failed verification. No funds have been deducted from your subscription account.
              </p>
            </div>

            {orderId && (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Order Reference:</span>
                  <span className="text-slate-300">{orderId}</span>
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
