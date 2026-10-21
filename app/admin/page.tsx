import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  Shield,
  Users,
  DollarSign,
  Activity,
  CheckCircle2,
  Key,
} from "lucide-react";
import Link from "next/link";
import {
  UserManagementTable,
  AdminUserItem,
} from "@/components/admin/UserManagementTable";
import {
  PaymentHistoryTable,
  AdminPaymentItem,
} from "@/components/admin/PaymentHistoryTable";
import {
  AdminAuditLogTable,
  AdminAuditItem,
} from "@/components/admin/AdminAuditLogTable";

export default async function AdminPage() {
  const session = await auth();

  // Strict route protection: Only ADMIN role is permitted
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // System KPIs queries
  const totalUsers = await prisma.user.count();
  const activeSubs = await prisma.subscription.count({
    where: { status: "ACTIVE" },
  });
  const manualVips = await prisma.subscription.count({
    where: { status: "ACTIVE", source: "MANUAL_OVERRIDE" },
  });
  const stripeSubs = activeSubs - manualVips;

  const MONTHLY_PLAN_PRICE = 28; // Standard monthly tier ($28/mo)
  const estimatedMrr = stripeSubs * MONTHLY_PLAN_PRICE;

  // Retrieve user directory with subscriptions
  const dbUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { subscription: true },
  });

  const users: AdminUserItem[] = dbUsers.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    subscriptionStatus: u.subscription?.status ?? "INACTIVE",
    subscriptionSource: u.subscription?.source ?? "STRIPE",
    currentPeriodEnd: u.subscription?.currentPeriodEnd
      ? u.subscription.currentPeriodEnd.toISOString()
      : null,
    createdAt: u.createdAt.toISOString(),
  }));

  // Retrieve payment records
  const dbPayments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: { user: { select: { email: true } } },
  });

  const payments: AdminPaymentItem[] = dbPayments.map((p) => ({
    id: p.id,
    userEmail: p.user.email,
    provider: p.provider,
    providerReference: p.providerReference,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    createdAt: p.createdAt.toISOString(),
  }));

  // Retrieve audit trail events
  const dbAudits = await prisma.adminAuditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      adminUser: { select: { email: true } },
      targetUser: { select: { email: true } },
    },
  });

  const auditEvents: AdminAuditItem[] = dbAudits.map((a) => ({
    id: a.id,
    adminEmail: a.adminUser.email,
    targetEmail: a.targetUser.email,
    action: a.action,
    reason: a.reason,
    createdAt: a.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 bg-terminal-black text-xs font-mono p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8 select-none">
      {/* Admin Top Header Banner */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-terminal-card border border-terminal-gold/50 rounded-lg text-terminal-gold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-extrabold text-white text-base tracking-wider">
                ADMINISTRATIVE BACK-OFFICE PORTAL
              </h1>
              <span className="px-2 py-0.5 rounded bg-terminal-gold/20 text-terminal-gold border border-terminal-gold/40 text-[10px] font-extrabold tracking-widest uppercase">
                ROOT PRIVILEGES
              </span>
            </div>
            <p className="text-terminal-subtext text-xs mt-1">
              Active Operator: <span className="text-gray-200 font-bold">{session?.user?.email}</span> (UID: {session?.user?.id})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-terminal-card hover:bg-terminal-surface border border-terminal-gold text-terminal-gold rounded-lg transition text-xs font-bold tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.15)] flex items-center gap-2"
          >
            <span>‹ RETURN TO DASHBOARD</span>
          </Link>
        </div>
      </div>

      {/* System KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Registered Users */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] tracking-wider uppercase">
            <span>Total Registered Users</span>
            <Users className="w-4 h-4 text-terminal-gold" />
          </div>
          <div className="text-3xl font-extrabold text-white tabular-nums">
            {totalUsers.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-subtext">
            PostgreSQL Database · Synced
          </div>
        </div>

        {/* KPI 2: Active Clearances */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] tracking-wider uppercase">
            <span>Active Clearances</span>
            <CheckCircle2 className="w-4 h-4 text-terminal-green" />
          </div>
          <div className="text-3xl font-extrabold text-terminal-green tabular-nums">
            {activeSubs.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-green/90">
            {stripeSubs} Stripe Paid · {manualVips} Manual VIP
          </div>
        </div>

        {/* KPI 3: Estimated Monthly MRR */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] tracking-wider uppercase">
            <span>Estimated MRR</span>
            <DollarSign className="w-4 h-4 text-terminal-gold" />
          </div>
          <div className="text-3xl font-extrabold text-terminal-gold tabular-nums">
            ${estimatedMrr.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-subtext">
            Based on ${MONTHLY_PLAN_PRICE}/mo plan rate
          </div>
        </div>

        {/* KPI 4: Data Feed Health */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between text-terminal-subtext text-[11px] tracking-wider uppercase">
            <span>Data Feed Health</span>
            <Activity className="w-4 h-4 text-terminal-green animate-pulse" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-terminal-green shadow-[0_0_10px_#00E676]"></span>
            </span>
            <span className="text-lg font-extrabold text-terminal-green tracking-wide">
              NOMINAL
            </span>
          </div>
          <div className="text-[10px] text-terminal-subtext">
            PAXG WebSocket 1:1 Live Engine
          </div>
        </div>
      </div>

      {/* User Management & Manual VIP Grant Table */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden shadow-xl">
        <div className="bg-terminal-card px-5 py-3.5 border-b border-terminal-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-4 h-4 text-terminal-gold" />
            <span className="font-extrabold text-white tracking-wider text-xs uppercase">
              OPERATOR DIRECTORY & VIP ACCESS CONTROLS
            </span>
          </div>
          <span className="text-[10px] text-terminal-subtext uppercase tracking-widest hidden sm:inline">
            Direct Prisma Override Actions
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <UserManagementTable users={users} />
        </div>
      </div>

      {/* Payment History Table */}
      <PaymentHistoryTable payments={payments} />

      {/* Admin Audit Trail */}
      <AdminAuditLogTable events={auditEvents} />
    </div>
  );
}
