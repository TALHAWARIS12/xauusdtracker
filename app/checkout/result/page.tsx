import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ArrowRight, LayoutDashboard } from "lucide-react";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

interface CheckoutResultProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutResultPage({ searchParams }: CheckoutResultProps) {
  const params = await searchParams;
  const session = params.session;

  const isSuccess = session === "success";
  const isCancelled = session === "cancelled";

  if (isSuccess) {
    try {
      const cookieStore = await cookies();
      cookieStore.set("sandbox_pro", "true", {
        path: "/",
        maxAge: 30 * 86400,
        sameSite: "lax",
      });
    } catch {}
  }

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
                Your payment was successfully processed. Zero-delay order flow depth, real-time tick charts, and automated trade signals are now active.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/dashboard?payment=success"
                className="btn-primary w-full py-3 text-sm font-semibold shadow-gold"
                id="result-launch-dashboard-btn"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Open Pro Dashboard</span>
                <ArrowRight className="h-4 w-4" />
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
