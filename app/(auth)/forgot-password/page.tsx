"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Shield, Mail, ArrowRight, Check, Copy, ExternalLink, KeyRound, AlertCircle } from "lucide-react";

const SUPPORT_EMAIL = "Support@xauusdtracker.com";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);

  const resetSubject = `Password Reset Request - ${email.trim() || "Operator Account"}`;
  const resetBody = `Hi XAUUSD Tracker Support,\n\nI forgot my security passkey for my operator account. Please reset my credentials so I can log in to my Pro terminal.\n\nAccount Email: ${email.trim() || "[Enter your account email here]"}\nTimestamp: ${new Date().toISOString()}`;

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
            <span className="ml-2 font-bold text-gray-200">AUTH.GATEWAY // RECOVERY</span>
          </div>
          <span className="text-[10px] text-terminal-gold font-bold">PASSKEY RECOVERY</span>
        </div>

        {/* Terminal Body */}
        <div className="bg-terminal-card border-x border-b border-terminal-border rounded-b-lg p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Banner */}
          <div className="border-b border-terminal-border/80 pb-4">
            <div className="flex items-center gap-2 text-terminal-gold text-xs font-bold tracking-widest uppercase mb-1">
              <KeyRound className="w-4 h-4 text-terminal-gold" />
              <span>PASSKEY RESET & RECOVERY</span>
            </div>
            <p className="text-xs text-terminal-subtext leading-relaxed">
              If you forgot your password or cannot access your account, our support engineers will verify your operator clearance and reset your credentials immediately.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="recovery-email"
                className="block text-xs font-semibold uppercase tracking-wider text-terminal-subtext mb-1.5"
              >
                [ENTER YOUR REGISTERED EMAIL]
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-terminal-subtext">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="recovery-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@xauusdtracker.com"
                  className="w-full bg-terminal-surface border border-terminal-border focus:border-terminal-gold focus:ring-1 focus:ring-terminal-gold rounded py-2.5 pl-10 pr-3 text-xs text-white placeholder-terminal-subtext/40 transition outline-none font-mono"
                />
              </div>
            </div>

            {/* Support Desk Action Card */}
            <div className="rounded-xl border border-terminal-gold/30 bg-terminal-surface p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-gray-300">
                <AlertCircle className="w-4 h-4 text-terminal-gold shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Official Support Recovery Desk</span>
                  <p className="text-[11px] text-terminal-subtext mt-0.5">
                    Click below to open Gmail pre-filled with your password reset request directly to our system administrators:
                  </p>
                </div>
              </div>

              {/* Email Address & Copy */}
              <div className="flex items-center justify-between gap-2 bg-terminal-black rounded-lg p-2 border border-terminal-border">
                <span className="font-mono text-xs font-semibold text-terminal-gold truncate">
                  {SUPPORT_EMAIL}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-[10px] bg-terminal-card hover:bg-terminal-surface border border-terminal-border text-gray-300 rounded flex items-center gap-1 cursor-pointer transition"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-terminal-green" />
                      <span className="text-terminal-green font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Action Buttons */}
              <a
                href={gmailComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold text-xs tracking-wider uppercase rounded transition flex items-center justify-center gap-2 border border-terminal-gold shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer"
              >
                <span>OPEN GMAIL RESET REQUEST</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="text-center">
                <a
                  href={mailtoUrl}
                  className="text-[11px] text-terminal-subtext hover:text-white underline transition"
                >
                  Use default email client instead
                </a>
              </div>
            </div>
          </div>

          {/* Footer Return Link */}
          <div className="pt-4 border-t border-terminal-border flex flex-col items-center gap-3 text-center">
            <Link
              href="/login"
              className="text-xs text-terminal-gold hover:underline font-bold flex items-center gap-1.5"
            >
              <span>‹ RETURN TO OPERATOR LOGIN</span>
            </Link>
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
