import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.06] bg-ink-950/60">
      <div className="container-app grid gap-10 py-12 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-7 w-7" />
            <span className="font-display text-sm font-bold text-white">
              XAUUSD<span className="text-gold-300"> Tracker</span>
            </span>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            Real-time gold market analytics for traders — live spot price, buyer and seller
            sentiment, order flow and trade signals in one clean dashboard.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Product</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/dashboard" className="text-slate-300 transition hover:text-white">Live Dashboard</Link></li>
            <li><Link href="/pricing" className="text-slate-300 transition hover:text-white">Pricing</Link></li>
            <li><Link href="/account" className="text-slate-300 transition hover:text-white">My Account</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/disclaimer" className="text-slate-300 transition hover:text-white">Risk Disclaimer</Link></li>
            <li><Link href="/privacy" className="text-slate-300 transition hover:text-white">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-slate-300 transition hover:text-white">Terms of Service</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[0.06] bg-ink-950/80">
        <div className="container-app flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-gold-300">Got complaints or inquiries?</span>
            <span>Support Desk:</span>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=Support@xauusdtracker.com&su=Support%20%26%20Complaints%20-%20XAUUSD%20Tracker"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-white underline hover:text-gold-300 transition"
              title="Open Gmail to email Support@xauusdtracker.com"
            >
              Support@xauusdtracker.com
            </a>
          </div>
          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=Support@xauusdtracker.com&su=Support%20%26%20Complaints%20-%20XAUUSD%20Tracker"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-gold-300 hover:bg-gold-400/20 hover:text-white transition w-fit"
          >
            Send Complaint via Gmail →
          </a>
        </div>
      </div>

      <div className="border-t border-white/[0.04]">
        <div className="container-app flex flex-col gap-3 py-6 text-xs text-slate-500 md:flex-row md:items-start md:justify-between">
          <p>© {new Date().getUTCFullYear()} XAUUSD Tracker. All rights reserved.</p>
          <p className="max-w-3xl leading-relaxed md:text-right">
            Market data and analytics are provided for informational and educational purposes only and
            do not constitute financial advice. Liquidity zones and signals are model-based estimates.
            Trading gold involves substantial risk.
          </p>
        </div>
      </div>
    </footer>
  );
}
