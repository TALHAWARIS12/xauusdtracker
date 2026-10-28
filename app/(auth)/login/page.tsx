"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Terminal, Shield, Lock, Mail, ArrowRight, AlertTriangle } from "lucide-react";
import { loginUser, LoginState } from "@/actions/auth-actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState | null, FormData>(
    loginUser,
    null
  );


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
            <span className="ml-2 font-bold text-gray-200">AUTH.GATEWAY // LOGIN</span>
          </div>
          <span className="text-[10px] text-terminal-gold font-bold">SECURE PORT 443</span>
        </div>

        {/* Terminal Body */}
        <div className="bg-terminal-card border-x border-b border-terminal-border rounded-b-lg p-6 sm:p-8 shadow-2xl">
          {/* Terminal Banner */}
          <div className="mb-6 border-b border-terminal-border/80 pb-4">
            <div className="flex items-center gap-2 text-terminal-gold text-xs font-bold tracking-widest uppercase mb-1">
              <Terminal className="w-4 h-4 text-terminal-gold" />
              <span>TERMINAL CREDENTIALS REQUIRED</span>
            </div>
            <p className="text-xs text-terminal-subtext leading-relaxed">
              Enter authorized operator clearance to access real-time XAU/USD telemetry, radar scanners, and quantitative indicators.
            </p>
          </div>

          {/* Error Notice */}
          {state?.error && (
            <div className="mb-6 p-3 bg-terminal-red/10 border border-terminal-red/40 rounded flex items-start gap-2.5 text-xs text-terminal-red animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold">ACCESS REJECTED:</span> {state.error}
              </div>
            </div>
          )}

          {/* Form */}
          <form action={formAction} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-terminal-subtext mb-1.5"
              >
                [OPERATOR IDENTIFIER / EMAIL]
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
                  autoComplete="email"
                  placeholder="operator@xauusdtracker.com"
                  className="w-full bg-terminal-surface border border-terminal-border focus:border-terminal-gold focus:ring-1 focus:ring-terminal-gold rounded py-2.5 pl-10 pr-3 text-xs text-white placeholder-terminal-subtext/40 transition outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-terminal-subtext"
                >
                  [SECURITY PASSKEY]
                </label>
                <span className="text-[10px] text-terminal-subtext/60">SHA-256 / BCRYPT</span>
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
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full bg-terminal-surface border border-terminal-border focus:border-terminal-gold focus:ring-1 focus:ring-terminal-gold rounded py-2.5 pl-10 pr-3 text-xs text-white placeholder-terminal-subtext/40 transition outline-none font-mono"
                />
              </div>
              <div className="flex justify-end mt-1.5">
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-terminal-gold hover:underline font-bold"
                >
                  FORGOT SECURITY PASSKEY?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 px-4 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded transition flex items-center justify-center gap-2 border border-terminal-gold shadow-[0_0_15px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-terminal-black border-t-transparent rounded-full animate-spin" />
                  <span>AUTHENTICATING OPERATOR...</span>
                </>
              ) : (
                <>
                  <span>INITIALIZE TERMINAL SESSION</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Metadata & Registration Link */}
          <div className="mt-8 pt-4 border-t border-terminal-border flex flex-col gap-3 text-center">
            <p className="text-xs text-terminal-subtext">
              Unregistered terminal node?{" "}
              <Link
                href="/register"
                className="text-terminal-gold hover:underline font-bold"
              >
                ENROLL OPERATOR CREDENTIALS ›
              </Link>
            </p>
            <div className="flex items-center justify-center gap-2 text-[10px] text-terminal-subtext/60">
              <Shield className="w-3 h-3 text-terminal-green" />
              <span>TLS 1.3 / STRICT CIPHER SUITE / AUDITED LOGS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
