import Link from "next/link";
import { FileText, ShieldAlert } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 select-none">
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 flex items-center gap-3.5">
        <div className="p-2.5 bg-terminal-card border border-terminal-gold/40 rounded-lg text-terminal-gold">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-white text-base tracking-wider uppercase">
            TERMS OF SERVICE // OPERATOR AGREEMENT
          </h1>
          <p className="text-terminal-subtext text-xs mt-0.5">
            XAUUSD Intelligence Terms of Access and Use
          </p>
        </div>
      </div>

      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 space-y-6 text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">1. ACCEPTANCE OF TERMS</h2>
          <p>
            By accessing or subscribing to XAUUSD Intelligence (&ldquo;the Platform&rdquo;), you agree to be bound by these Terms of Service. If you disagree with any portion of these terms, you must terminate your session and cease using the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">2. LICENSE & TERMINAL CLEARANCE</h2>
          <p>
            Subscribers are granted a non-exclusive, non-transferable, revocable license to access the terminal interface and proprietary market indicators for personal, non-commercial analytical use. Redistribution, reverse-engineering, scraping, or programmatic reproduction of quantitative signals or concentration data is strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-terminal-gold" />
            3. SUBSCRIPTIONS, BILLING & CANCELLATION
          </h2>
          <p>
            Subscriptions are billed in advance according to the selected plan interval ($3/day, $10/week, $28/month, or $88/year). You may cancel your subscription at any time prior to the end of your billing cycle. Cancellation takes effect at the expiration of your current prepaid period, during which time access to the platform remains active. Refunds are processed at administrative discretion in accordance with applicable consumer laws.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">4. DISCLAIMER OF WARRANTIES</h2>
          <p>
            The service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. We disclaim all warranties of any kind, whether express or implied, regarding uptime, data freshness, algorithmic setup profitability, or market outcome accuracy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">5. LIMITATION OF LIABILITY</h2>
          <p>
            Under no circumstances shall the platform operators, developers, or affiliates be liable for any direct, indirect, incidental, or consequential financial losses arising from trading decisions made by operators using this terminal.
          </p>
        </section>

        <div className="pt-4 border-t border-terminal-border flex justify-between items-center text-xs">
          <span className="text-terminal-subtext">Version 1.0 · October 2026</span>
          <Link href="/dashboard" className="text-terminal-gold hover:underline font-bold">
            Return to Dashboard ›
          </Link>
        </div>
      </div>
    </div>
  );
}
