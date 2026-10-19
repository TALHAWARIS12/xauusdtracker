import Link from "next/link";
import { CheckCircle2, XCircle, Clock, ArrowRight, Terminal } from "lucide-react";

interface CheckoutResultProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CheckoutResultPage({ searchParams }: CheckoutResultProps) {
  const params = await searchParams;
  const session = params.session;

  const isSuccess = session === "success";
  const isCancelled = session === "cancelled";
  const isPending = session === "pending";

  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-xl mx-auto w-full flex items-center justify-center min-h-[60vh] select-none">
      <div className="w-full bg-terminal-surface border border-terminal-border rounded-xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        {isSuccess ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-terminal-green/10 border border-terminal-green/40 flex items-center justify-center text-terminal-green shadow-[0_0_25px_rgba(0,230,118,0.25)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] tracking-widest text-terminal-green uppercase font-extrabold px-2.5 py-0.5 rounded bg-terminal-green/10 border border-terminal-green/30 inline-block">
                PAYMENT CONFIRMED // VIP ACCESS ACTIVE
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Institutional Terminal Clearance Granted
              </h1>
              <p className="text-xs text-terminal-subtext max-w-md mx-auto leading-relaxed">
                Your payment was successfully processed. Proprietary stop-loss/take-profit concentration zones and quantitative trade setups are now completely unlocked.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/terminal"
                className="w-full py-3.5 px-6 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2 border border-terminal-gold shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              >
                <Terminal className="w-4 h-4" />
                <span>LAUNCH QUANTITATIVE TERMINAL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : isCancelled ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-terminal-red/10 border border-terminal-red/40 flex items-center justify-center text-terminal-red">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] tracking-widest text-terminal-red uppercase font-extrabold px-2.5 py-0.5 rounded bg-terminal-red/10 border border-terminal-red/30 inline-block">
                CHECKOUT CANCELLED
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Subscription Initialization Aborted
              </h1>
              <p className="text-xs text-terminal-subtext max-w-md mx-auto leading-relaxed">
                The Stripe Checkout session was cancelled before completion. No charges were made to your account.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/pricing"
                className="w-full py-3 px-6 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span>RETURN TO PRICING & RETRY</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/terminal"
                className="w-full py-2.5 px-6 bg-terminal-card hover:bg-terminal-surface border border-terminal-border text-terminal-subtext hover:text-white rounded text-center transition"
              >
                CONTINUE TO RESTRICTED TERMINAL
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-terminal-gold/10 border border-terminal-gold/40 flex items-center justify-center text-terminal-gold">
              <Clock className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-2">
              <span className="text-[10px] tracking-widest text-terminal-gold uppercase font-extrabold px-2.5 py-0.5 rounded bg-terminal-gold/10 border border-terminal-gold/30 inline-block">
                VERIFYING PAYMENT STATUS
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Synchronizing Clearance Webhooks
              </h1>
              <p className="text-xs text-terminal-subtext max-w-md mx-auto leading-relaxed">
                Awaiting signed confirmation from the Stripe payment gateway. If your card was charged, clearance will activate within seconds.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/terminal"
                className="w-full py-3.5 px-6 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <span>CHECK TERMINAL ACCESS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
