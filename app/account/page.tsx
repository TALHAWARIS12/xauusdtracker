import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Shield, Calendar, CreditCard, Terminal, ArrowRight, Zap, CheckCircle2, XCircle } from "lucide-react";

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
  const isActive = sub?.status === "ACTIVE";

  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 select-none">
      {/* Header Banner */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-terminal-card border border-terminal-gold/40 rounded-lg text-terminal-gold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-base tracking-wider">
              OPERATOR ACCOUNT PROFILE
            </h1>
            <p className="text-terminal-subtext text-xs mt-0.5">
              Clearance Identifier: <span className="text-gray-200">{user.email}</span>
            </p>
          </div>
        </div>

        <Link
          href="/terminal"
          className="px-4 py-2 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold rounded flex items-center gap-2 transition"
        >
          <Terminal className="w-4 h-4" />
          <span>OPEN TERMINAL</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Credentials Profile */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase border-b border-terminal-border pb-3">
            <Shield className="w-4 h-4 text-terminal-gold" />
            <span>OPERATOR CREDENTIALS</span>
          </div>

          <div className="space-y-3 bg-terminal-card p-4 rounded border border-terminal-border text-[11px]">
            <div className="flex justify-between">
              <span className="text-terminal-subtext">EMAIL IDENTIFIER:</span>
              <span className="text-white font-bold">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-subtext">NODE UID:</span>
              <span className="text-gray-300 font-mono">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-subtext">SECURITY ROLE:</span>
              <span
                className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                  user.role === "ADMIN"
                    ? "bg-terminal-gold/20 text-terminal-gold border border-terminal-gold/40"
                    : "bg-terminal-green/20 text-terminal-green border border-terminal-green/40"
                }`}
              >
                {user.role}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-terminal-subtext">COMMISSION DATE:</span>
              <span className="text-gray-300">
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Subscription / Clearance Status */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-xs uppercase border-b border-terminal-border pb-3">
            <CreditCard className="w-4 h-4 text-terminal-gold" />
            <span>INSTITUTIONAL ACCESS STATUS</span>
          </div>

          <div className="space-y-3 bg-terminal-card p-4 rounded border border-terminal-border text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-terminal-subtext">CLEARANCE STATUS:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                  isActive
                    ? "bg-terminal-green/20 text-terminal-green border-terminal-green/40"
                    : "bg-terminal-red/20 text-terminal-red border-terminal-red/40"
                }`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACTIVE CLEARANCE</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>INACTIVE / RESTRICTED</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-terminal-subtext">TIER / PLAN:</span>
              <span className="text-white font-bold">
                {sub?.plan?.name || "Institutional Intelligence Clearance"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-terminal-subtext">GRANT SOURCE:</span>
              <span className="text-terminal-gold font-bold">
                {sub?.source === "MANUAL_OVERRIDE"
                  ? "VIP MANUAL GRANT (ADMIN)"
                  : "STRIPE SUBSCRIPTION"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-terminal-subtext">CURRENT PERIOD EXPIRY:</span>
              <span className="text-gray-300">
                {sub?.currentPeriodEnd ? (
                  new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                ) : (
                  "—"
                )}
              </span>
            </div>
          </div>

          <div className="pt-2">
            {!isActive ? (
              <Link
                href="/pricing"
                className="w-full py-2.5 px-4 bg-terminal-gold hover:bg-amber-400 text-terminal-black font-extrabold rounded flex items-center justify-center gap-2 transition"
              >
                <Zap className="w-4 h-4" />
                <span>UPGRADE TO INSTITUTIONAL CLEARANCE ($99/MO)</span>
              </Link>
            ) : (
              <div className="text-[11px] text-terminal-subtext text-center">
                Your subscription renews automatically. To manage your billing method or cancel, contact admin or visit Stripe Customer Portal.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment History */}
      {user.payments && user.payments.length > 0 && (
        <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden">
          <div className="bg-terminal-card px-4 py-2.5 border-b border-terminal-border">
            <span className="font-bold text-white text-xs uppercase tracking-wider">
              RECENT TRANSACTION RECORDS
            </span>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-terminal-subtext border-b border-terminal-border text-[10px] uppercase">
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border/40">
                {user.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2 text-gray-200">{p.providerReference || p.id}</td>
                    <td className="py-2 text-white font-bold">
                      ${p.amount.toFixed(2)} {p.currency}
                    </td>
                    <td className="py-2">
                      <span className="text-[10px] text-terminal-green bg-terminal-green/10 border border-terminal-green/30 px-1.5 py-0.5 rounded">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-terminal-subtext">
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
