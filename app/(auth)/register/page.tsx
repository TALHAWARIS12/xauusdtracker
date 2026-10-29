"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, Shield, Lock, Mail, CheckCircle2, AlertTriangle, ArrowRight, Gift } from "lucide-react";
import { registerUser, RegisterState } from "@/actions/auth-actions";
import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";

  const [state, formAction, isPending] = useActionState<RegisterState | null, FormData>(
    registerUser,
    null
  );

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/login?enrolled=true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-terminal-black font-mono">
      {/* Background terminal grid glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#182030_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Terminal Window Header Bar */}
        <div className="bg-terminal-surface border border-terminal-border rounded-t-lg px-4 py-2 flex items-center justify-between text-xs text-terminal-subtext">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-terminal-red/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-terminal-gold/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-terminal-green/80 inline-block" />
            <span className="ml-2 font-bold text-gray-200">NODE.ENROLLMENT // NEW OPERATOR</span>
          </div>
          <span className="text-[10px] text-terminal-green font-bold">STATUS: READY</span>
        </div>

        {/* Terminal Body */}
        <div className="bg-terminal-card border-x border-b border-terminal-border rounded-b-lg p-6 sm:p-8 shadow-2xl">
          {/* Header Banner */}
          <div className="mb-6 border-b border-terminal-border/80 pb-4">
            <div className="flex items-center gap-2 text-terminal-gold text-xs font-bold tracking-widest uppercase mb-1">
              <Terminal className="w-4 h-4 text-terminal-gold" />
              <span>COMMISSION OPERATOR ACCESS KEY</span>
            </div>
            <p className="text-xs text-terminal-subtext leading-relaxed">
              Create a cryptographic credential to initialize telemetry streaming, algorithmic signal radar, and institutional tier modules.
            </p>
          </div>

          {/* Referral Badge */}
          {refCode && (
            <div className="mb-5 flex items-center gap-2.5 rounded border border-terminal-gold/40 bg-terminal-gold/10 px-3 py-2.5 text-xs text-terminal-gold">
              <Gift className="w-4 h-4 shrink-0" />
              <div>
                <span className="font-bold">Referral Code Applied:</span>{" "}
                <span className="font-mono tracking-wider">{refCode}</span>
                <p className="text-[10px] text-terminal-gold/70 mt-0.5">
                  Your referrer will earn rewards when you subscribe — register now to unlock the connection.
                </p>
              </div>
            </div>
          )}

          {/* Success Notification */}
          {state?.success ? (
            <div className="p-4 bg-terminal-green/10 border border-terminal-green/40 rounded text-xs text-terminal-green flex items-start gap-3 my-4">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">CREDENTIALS COMMISSIONED SUCCESSFULLY</p>
                <p className="text-[11px] text-gray-300 mt-1">
                  Operator profile created in database. Redirecting to terminal gateway login...
                </p>
                <Link
                  href="/login"
                  className="mt-2 inline-flex items-center gap-1 text-terminal-gold hover:underline font-bold"
                >
                  PROCEED TO LOGIN IMMEDIATELY ›
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* General Error Notice */}
              {state?.error && (
                <div className="mb-6 p-3 bg-terminal-red/10 border border-terminal-red/40 rounded flex items-start gap-2.5 text-xs text-terminal-red">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold">ENROLLMENT FAILED:</span> {state.error}
                  </div>
                </div>
              )}

              {/* Form */}
              <form action={formAction} className="space-y-4">
                {/* Hidden referral code field */}
                <input type="hidden" name="referralCode" value={refCode} />

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold uppercase tracking-wider text-terminal-subtext mb-1.5"
                  >
                    [OPERATOR EMAIL ADDRESS]
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-terminal-subtext">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="analyst@institutional-fund.com"
                      className="w-full bg-terminal-surface border border-terminal-border focus:border-terminal-gold focus:ring-1 focus:ring-terminal-gold rounded py-2.5 pl-10 pr-3 text-xs text-white placeholder-terminal-subtext/40 transition outline-none font-mono"
                    />
                  </div>
                  {state?.fieldErrors?.email && (
                    <p className="mt-1 text-[11px] text-terminal-red">
                      {state.fieldErrors.email[0]}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold uppercase tracking-wider text-terminal-subtext"
                    >
                      [SECURITY PASSKEY]
                    </label>
                    <span className="text-[10px] text-terminal-subtext/60">MIN 8 CHARACTERS</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-terminal-subtext">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-terminal-surface border border-terminal-border focus:border-terminal-gold focus:ring-1 focus:ring-terminal-gold rounded py-2.5 pl-10 pr-3 text-xs text-white placeholder-terminal-subtext/40 transition outline-none font-mono"
                    />
                  </div>
                  {state?.fieldErrors?.password && (
                    <p className="mt-1 text-[11px] text-terminal-red">
                      {state.fieldErrors.password[0]}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold uppercase tracking-wider text-terminal-subtext mb-1.5"
                  >
                    [CONFIRM SECURITY PASSKEY]
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-terminal-subtext">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      className="w-full bg-terminal-surface border border-terminal-border focus:border-terminal-gold focus:ring-1 focus:ring-terminal-gold rounded py-2.5 pl-10 pr-3 text-xs text-white placeholder-terminal-subtext/40 transition outline-none font-mono"
                    />
                  </div>
                  {state?.fieldErrors?.confirmPassword && (
                    <p className="mt-1 text-[11px] text-terminal-red">
                      {state.fieldErrors.confirmPassword[0]}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full py-3 px-4 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded transition flex items-center justify-center gap-2 border border-terminal-gold shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isPending ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-terminal-black border-t-transparent rounded-full animate-spin" />
                        <span>COMMISSIONING NODE KEY...</span>
                      </>
                    ) : (
                      <>
                        <span>CREATE TERMINAL OPERATOR</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Footer Metadata & Login Link */}
          <div className="mt-8 pt-4 border-t border-terminal-border flex flex-col gap-3 text-center">
            <p className="text-xs text-terminal-subtext">
              Already possess clearance credentials?{" "}
              <Link
                href="/login"
                className="text-terminal-gold hover:underline font-bold"
              >
                INITIALIZE GATEWAY LOGIN ›
              </Link>
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-terminal-subtext/60">
              <Shield className="w-3 h-3 text-terminal-gold" />
              <span>BCRYPT SALT-10 HASHING // STRICT SCHEMAS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-terminal-black">
        <div className="w-8 h-8 border-2 border-terminal-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
