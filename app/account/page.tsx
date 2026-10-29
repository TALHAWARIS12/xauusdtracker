import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Shield, CreditCard, LayoutDashboard, Zap, CheckCircle2, XCircle } from "lucide-react";
import { getSubscriptionStatus } from "@/lib/subscription";
import { ChangePasswordForm } from "@/components/account/ChangePasswordForm";
import { ReferralPanel } from "@/components/account/ReferralPanel";
import { getReferralStats } from "@/actions/referral-actions";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: {
        include: { plan: true },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const sub = user.subscription;
  const isSubscribed = await getSubscriptionStatus(user.id);
  const referralStats = await getReferralStats();

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "https://xauusdtracker.com";

  return (
    <div className="container-app py-10 max-w-4xl space-y-8">
      {/* Header Banner */}
      <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400/10 border border-gold-300/30 text-gold-300 shadow-gold">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-white tracking-tight">
              Account Overview
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Email: <span className="text-white font-medium">{user.email}</span>
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="btn-primary px-5 py-2.5 text-xs font-semibold shadow-gold self-start md:self-auto"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Open Dashboard</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credentials Profile */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase border-b border-white/[0.06] pb-3">
            <Shield className="h-4 w-4 text-gold-300" />
            <span>Profile Details</span>
          </div>

          <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Email Address:</span>
              <span className="text-white font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Account ID:</span>
              <span className="text-slate-300 font-mono text-[11px]">{user.id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Role:</span>
              <span
                className={`badge text-[10px] uppercase font-bold ${
                  user.role === "ADMIN"
                    ? "bg-gold-400/10 text-gold-300 border border-gold-400/30"
                    : "bg-bull-400/10 text-bull-300 border border-bull-400/30"
                }`}
              >
                {user.role}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Member Since:</span>
              <span className="text-slate-300">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase border-b border-white/[0.06] pb-3">
            <CreditCard className="h-4 w-4 text-gold-300" />
            <span>Subscription Status</span>
          </div>

          <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Clearance Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase border ${
                  isSubscribed
                    ? "bg-bull-400/10 text-bull-300 border-bull-400/30"
                    : "bg-bear-400/10 text-bear-300 border-bear-400/30"
                }`}
              >
                {isSubscribed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Pro Active</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Free Plan</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Active Tier:</span>
              <span className="text-white font-medium">
                {sub?.plan?.name || (isSubscribed ? "Pro Membership" : "Freemium")}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Period Expiry:</span>
              <span className="text-slate-300">
                {sub?.currentPeriodEnd ? (
                  new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                ) : isSubscribed ? (
                  "Active (Auto-renew)"
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>

          <div className="pt-2">
            {!isSubscribed ? (
              <Link
                href="/pricing"
                className="btn-primary w-full py-2.5 text-xs font-semibold shadow-gold"
              >
                <Zap className="h-4 w-4" />
                <span>Upgrade to Pro (from $3/day)</span>
              </Link>
            ) : (
              <p className="text-[11px] text-slate-400 text-center">
                Your subscription is active. All institutional data is unlocked.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Security & Passkey Management */}
      <ChangePasswordForm />

      {/* Refer & Earn Panel */}
      <ReferralPanel
        initialCode={referralStats.referralCode}
        totalReferrals={referralStats.totalReferrals}
        activeReferrals={referralStats.activeReferrals}
        totalRewardDays={referralStats.totalRewardDays}
        totalCommissionUsd={referralStats.totalCommissionUsd}
        earnings={referralStats.earnings}
        appUrl={appUrl}
      />

      {/* Payment History */}
      {user.payments && user.payments.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
            <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400">
                  <th className="px-4 py-2.5">Reference</th>
                  <th className="px-4 py-2.5">Amount</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {user.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-slate-400">{p.providerReference || p.id}</td>
                    <td className="px-4 py-3 font-bold text-white tabular">
                      ${p.amount.toFixed(2)} {p.currency}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-bull-400/10 px-2 py-0.5 text-[10px] font-semibold text-bull-300 border border-bull-400/20">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
