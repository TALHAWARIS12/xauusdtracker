"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Check, Copy, ExternalLink, ShieldCheck, HelpCircle } from "lucide-react";
import { BrandLogo } from "@/components/layout/BrandLogo";

const SUPPORT_EMAIL = "Support@xauusdtracker.com";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const resetSubject = `Password Reset Request - ${email.trim() || "Account"}`;
  const resetBody = `Hi XAUUSD Tracker Support,\n\nI forgot my password for my account. Please reset my credentials so I can log in to my trading dashboard.\n\nAccount Email: ${email.trim() || "[Enter your account email here]"}\nTimestamp: ${new Date().toISOString()}`;

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    SUPPORT_EMAIL
  )}&su=${encodeURIComponent(resetSubject)}&body=${encodeURIComponent(resetBody)}`;

  const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    resetSubject
  )}&body=${encodeURIComponent(resetBody)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4 bg-ink-950 relative overflow-hidden">
      {/* Subtle warm ambient highlight at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-[radial-gradient(ellipse_at_top,rgba(242,185,59,0.06),transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-[420px] mx-auto relative">
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
            Reset password
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Get help regaining access to your XAUUSD Tracker account
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-ink-900 border border-white/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.7)] rounded-2xl p-7 sm:p-8 space-y-5">
          {/* Email input */}
          <div>
            <label
              htmlFor="recovery-email"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Your registered email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-ink-850 border border-white/10 hover:border-white/20 focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 text-white placeholder-slate-500 rounded-xl py-2.5 pl-10 pr-3.5 text-sm transition outline-none"
              />
            </div>
          </div>

          {/* Support helper box */}
          <div className="rounded-xl border border-white/10 bg-ink-850 p-4 space-y-3">
            <div className="flex items-start gap-3 text-xs text-slate-300">
              <HelpCircle className="w-4 h-4 text-gold-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-white block">Official Support Desk</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Send a pre-filled reset request directly to our verified support team:
                </p>
              </div>
            </div>

            {/* Email Address & Copy */}
            <div className="flex items-center justify-between gap-2 bg-ink-900 rounded-lg p-2.5 border border-white/[0.08]">
              <span className="text-xs font-medium text-gold-300 truncate">
                {SUPPORT_EMAIL}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-white transition-colors px-2 py-1 rounded bg-white/5 hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-bull-400" />
                    <span className="text-bull-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2.5 pt-1">
            <a
              href={gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-ink-950 font-semibold text-sm rounded-xl shadow-gold hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Open in Gmail</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={mailtoUrl}
              className="w-full py-2.5 px-4 bg-ink-850 hover:bg-ink-800 border border-white/10 hover:border-white/20 text-slate-200 font-medium text-xs rounded-xl transition flex items-center justify-center gap-2"
            >
              <span>Open in Default Mail Client</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Back to sign in */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] text-center">
            <Link
              href="/login"
              className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-bull-400" />
          <span>Priority support • Verified response within 24 hours</span>
        </div>
      </div>
    </div>
  );
}
