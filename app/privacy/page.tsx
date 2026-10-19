import Link from "next/link";
import { Shield, Lock } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 select-none">
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 flex items-center gap-3.5">
        <div className="p-2.5 bg-terminal-card border border-terminal-gold/40 rounded-lg text-terminal-gold">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-extrabold text-white text-base tracking-wider uppercase">
            PRIVACY POLICY // DATA GOVERNANCE
          </h1>
          <p className="text-terminal-subtext text-xs mt-0.5">
            XAUUSD Intelligence Platform Data Protection Standards
          </p>
        </div>
      </div>

      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 space-y-6 text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">1. INFORMATION WE COLLECT</h2>
          <p>
            We adhere to data minimization principles. We only collect information strictly required to operate your account and deliver service clearance:
          </p>
          <ul className="list-disc list-inside space-y-1 text-terminal-subtext">
            <li>Account identifier: Email address provided upon registration.</li>
            <li>Security passkey: Irreversible bcrypt-hashed password (salt rounds 10). Plaintext passwords are never logged or stored.</li>
            <li>Subscription metadata: Stripe customer and subscription identifiers, start and expiry dates, and payment status.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-terminal-gold" />
            2. PAYMENT DATA SECURITY
          </h2>
          <p>
            All payment transactions are handled exclusively by Stripe over 256-Bit SSL encryption. We never receive, store, or process raw credit card numbers, CVVs, or cardholder banking credentials on our infrastructure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">3. LOGGING & COOKIES</h2>
          <p>
            We use encrypted session cookies strictly for authentication and route authorization (NextAuth JWT session tokens). We do not deploy third-party advertising cookies, cross-site trackers, or behavioral tracking scripts.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-white font-bold text-sm">4. DATA RETENTION & DELETION</h2>
          <p>
            Account records are retained for the duration of your active subscription. You may request account deletion and removal of associated transaction records by contacting administrative support.
          </p>
        </section>

        <div className="pt-4 border-t border-terminal-border flex justify-between items-center text-xs">
          <span className="text-terminal-subtext">Effective: October 2026</span>
          <Link href="/terminal" className="text-terminal-gold hover:underline font-bold">
            Return to Radar Terminal ›
          </Link>
        </div>
      </div>
    </div>
  );
}
