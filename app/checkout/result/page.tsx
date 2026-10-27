import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ArrowRight, LayoutDashboard, ShieldAlert } from "lucide-react";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";

export const dynamic = "force-dynamic";

interface CheckoutResultProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutResultPage({ searchParams }: CheckoutResultProps) {
  const params = await searchParams;
  const sessionParam = params.session;

  // Clean up any legacy test cookies
  try {
    const cookieStore = await cookies();
    cookieStore.delete("sandbox_pro");
    cookieStore.delete("pro_access");
  } catch {}

  // Server-side strict database subscription check
  let session = null;
  try {
    session = await auth();
  } catch {}

  const isSubscribed = session?.user?.id
    ? await getSubscriptionStatus(session.user.id)
    : false;

  const isSuccess = sessionParam === "success" && isSubscribed;
  const isPendingVerification = sessionParam === "success" && !isSubscribed;
  const isCancelled = sessionParam === "cancelled";

  return (
    <div className="container-app py-16 flex items-center justify-center min-h-[60vh]">
      <div className="card w-full max-w-lg p-8 sm:p-10 text-center space-y-6 shadow-glow border border-white/10">
        {isSuccess ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-bull-400/10 border border-bull-400/40 text-bull-300 shadow-[0_0_25px_rgba(52,211,153,0.3)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="badge-live">
                PAYMENT CONFIRMED · PRO ACCESS ACTIVE
              </span>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                Institutional Access Granted
              </h1>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your payment was successfully processed and verified in the ledger. Zero-delay order flow depth, real-time tick charts, and automated trade signals are now active.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="btn-primary w-full py-3 text-sm font-semibold shadow-gold"
                id="result-launch-dashboard-btn"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Open Pro Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        ) : isPendingVerification ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400/10 border border-gold-300/40 text-gold-300">
              <Clock className="h-8 w-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <span className="badge border border-gold-400/30 bg-gold-400/10 text-gold-300">
                BLOCKCHAIN VERIFICATION IN PROGRESS
              </span>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                Awaiting Payment Confirmation
              </h1>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Your crypto invoice was received. Clearance is automatically granted upon verified blockchain ledger confirmation. No access is granted until confirmed.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/account"
                className="btn-primary w-full py-2.5 text-sm font-semibold shadow-gold"
                id="result-check-account-btn"
              >
                <span>Check Account Clearance</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary w-full py-2.5 text-sm font-semibold"
              >
                Return to Dashboard
              </Link>
            </div>
          </>
        ) : isCancelled ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-bear-400/10 border border-bear-400/40 text-bear-300">
              <XCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="badge border border-bear-400/30 bg-bear-400/10 text-bear-300">
                CHECKOUT CANCELLED
              </span>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                Payment Not Completed
              </h1>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                The checkout session was cancelled before completion. No charges were made to your account.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link
                href="/pricing"
                className="btn-primary w-full py-2.5 text-sm font-semibold"
              >
                <span>Return to Pricing Plans</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="btn-secondary w-full py-2.5 text-sm font-semibold"
              >
                Continue with Free Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-400/10 border border-gold-300/40 text-gold-300">
              <Clock className="h-8 w-8 animate-spin" />
            </div>

            <div className="space-y-2">
              <span className="badge-pro">
                PROCESSING CONFIRMATION
              </span>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                Synchronizing Access
              </h1>
              <p className="text-sm text-slate-300 max-w-sm mx-auto leading-relaxed">
                Awaiting signed confirmation from the payment gateway. Your clearance will activate in just a few seconds.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="btn-primary w-full py-3 text-sm font-semibold"
              >
                <span>Check Dashboard Status</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
