"use client";

import { useActionState, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, CheckCircle2, AlertCircle, ArrowRight, Gift, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { registerUser, RegisterState } from "@/actions/auth-actions";
import { BrandLogo } from "@/components/layout/BrandLogo";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref") ?? "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    <div className="w-full max-w-[420px] mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center mb-5 transition-transform hover:scale-105 active:scale-95 duration-150"
          aria-label="Back to home"
        >
          <BrandLogo className="w-12 h-12" />
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Start tracking institutional gold liquidity and real-time signals
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-ink-900 border border-white/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] rounded-2xl p-7 sm:p-8">
        {/* Referral Badge */}
        {refCode && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-gold-400/30 bg-gold-400/10 p-3 text-xs text-gold-300">
            <Gift className="w-4 h-4 shrink-0 text-gold-400" />
            <div>
              <span className="font-semibold text-white">Referral code applied: </span>
              <span className="font-mono text-gold-400 font-bold">{refCode}</span>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {state?.success ? (
          <div className="p-4 bg-bull-500/10 border border-bull-500/30 rounded-xl text-xs text-bull-300 flex items-start gap-3 my-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-bull-400" />
            <div>
              <p className="font-semibold text-sm text-white">Account created successfully</p>
              <p className="text-slate-300 mt-1">
                Redirecting to sign-in page...
              </p>
              <Link
                href="/login?enrolled=true"
                className="mt-3 inline-flex items-center gap-1 text-gold-400 hover:text-gold-300 font-semibold"
              >
                Sign in now ›
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* General Error Notice */}
            {state?.error && (
              <div className="mb-6 p-3.5 bg-bear-500/10 border border-bear-500/30 rounded-xl flex items-start gap-3 text-xs text-bear-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-bear-400" />
                <div className="flex-1">
                  <span className="font-semibold">Sign up failed: </span>
                  {state.error}
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
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    className="w-full bg-ink-850 border border-white/10 hover:border-white/20 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm transition outline-none"
                  />
                </div>
                {state?.fieldErrors?.email && (
                  <p className="mt-1.5 text-xs text-bear-400">
                    {state.fieldErrors.email[0]}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-slate-300"
                  >
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">Min 8 characters</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    className="w-full bg-ink-850 border border-white/10 hover:border-white/20 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-10 text-sm transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {state?.fieldErrors?.password && (
                  <p className="mt-1.5 text-xs text-bear-400">
                    {state.fieldErrors.password[0]}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
                  Confirm password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    className="w-full bg-ink-850 border border-white/10 hover:border-white/20 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-10 text-sm transition outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {state?.fieldErrors?.confirmPassword && (
                  <p className="mt-1.5 text-xs text-bear-400">
                    {state.fieldErrors.confirmPassword[0]}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 px-4 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-ink-950 font-semibold text-sm rounded-xl shadow-gold hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-ink-950 border-t-transparent rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Footer Link */}
        <div className="mt-6 pt-5 border-t border-white/[0.08] text-center">
          <p className="text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Security badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-3.5 h-3.5 text-bull-400" />
        <span>Bcrypt salted encryption • Strict data privacy</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-ink-950 relative overflow-hidden">
      {/* Subtle warm ambient highlight at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-[radial-gradient(ellipse_at_top,rgba(242,185,59,0.06),transparent_70%)] pointer-events-none" />

      <Suspense
        fallback={
          <div className="w-full max-w-[420px] mx-auto flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
