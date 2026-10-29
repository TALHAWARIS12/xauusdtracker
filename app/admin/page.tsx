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
  Eye,
  Globe,
  TrendingUp,
  UserPlus,
  Compass,
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

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 1. Account Creation Analytics
  const totalUsers = await prisma.user.count();
  const usersToday = await prisma.user.count({
    where: { createdAt: { gte: oneDayAgo } },
  });
  const usersThisWeek = await prisma.user.count({
    where: { createdAt: { gte: sevenDaysAgo } },
  });

  // 2. Site Visitor & Traffic Analytics
  const totalVisits = await prisma.siteVisit.count();
  const visitsToday = await prisma.siteVisit.count({
    where: { createdAt: { gte: oneDayAgo } },
  });

  const uniqueVisitorsTotalResult = await prisma.siteVisit.groupBy({
    by: ["ipHash"],
    _count: { id: true },
  });
  const uniqueVisitorsTotal = uniqueVisitorsTotalResult.length;

  const uniqueVisitorsTodayResult = await prisma.siteVisit.groupBy({
    by: ["ipHash"],
    where: { createdAt: { gte: oneDayAgo } },
    _count: { id: true },
  });
  const uniqueVisitorsToday = uniqueVisitorsTodayResult.length;

  const topPagesResult = await prisma.siteVisit.groupBy({
    by: ["path"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const recentVisits = await prisma.siteVisit.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // 3. Clearances & MRR
  const activeSubs = await prisma.subscription.count({
    where: { status: "ACTIVE" },
  });
  const manualVips = await prisma.subscription.count({
    where: { status: "ACTIVE", source: "MANUAL_OVERRIDE" },
  });
  const cryptoSubs = activeSubs - manualVips;

  const MONTHLY_PLAN_PRICE = 48; // Standard monthly tier ($48/mo)
  const estimatedMrr = cryptoSubs * MONTHLY_PLAN_PRICE;


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
    subscriptionSource: u.subscription?.source ?? "NOWPAYMENTS",
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Registered Users */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-terminal-subtext text-[10px] tracking-wider uppercase">
            <span>Accounts Created</span>
            <Users className="w-3.5 h-3.5 text-terminal-gold" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {totalUsers.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-green flex items-center gap-1 font-bold">
            <UserPlus className="w-3 h-3" />
            <span>+{usersToday} Today · +{usersThisWeek} 7d</span>
          </div>
        </div>

        {/* KPI 2: Total Site Visits (Pageviews) */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-terminal-subtext text-[10px] tracking-wider uppercase">
            <span>Total Site Visits</span>
            <Eye className="w-3.5 h-3.5 text-terminal-gold" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {totalVisits.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-gold font-bold">
            +{visitsToday} views in last 24h
          </div>
        </div>

        {/* KPI 3: Unique Visitors */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-terminal-subtext text-[10px] tracking-wider uppercase">
            <span>Unique Visitors</span>
            <Globe className="w-3.5 h-3.5 text-terminal-gold" />
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums">
            {uniqueVisitorsTotal.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-subtext">
            {uniqueVisitorsToday} active today
          </div>
        </div>

        {/* KPI 4: Active Clearances */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-terminal-subtext text-[10px] tracking-wider uppercase">
            <span>Active Clearances</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-terminal-green" />
          </div>
          <div className="text-2xl font-extrabold text-terminal-green tabular-nums">
            {activeSubs.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-green/90">
            {cryptoSubs} Paid · {manualVips} VIP
          </div>
        </div>

        {/* KPI 5: Estimated Monthly MRR */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-terminal-subtext text-[10px] tracking-wider uppercase">
            <span>Estimated MRR</span>
            <DollarSign className="w-3.5 h-3.5 text-terminal-gold" />
          </div>
          <div className="text-2xl font-extrabold text-terminal-gold tabular-nums">
            ${estimatedMrr.toLocaleString()}
          </div>
          <div className="text-[10px] text-terminal-subtext">
            ${MONTHLY_PLAN_PRICE}/mo plan rate
          </div>
        </div>

        {/* KPI 6: Data Feed Health */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-terminal-subtext text-[10px] tracking-wider uppercase">
            <span>PAXG Live Feed</span>
            <Activity className="w-3.5 h-3.5 text-terminal-green animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-terminal-green shadow-[0_0_8px_#00E676]"></span>
            </span>
            <span className="text-lg font-extrabold text-terminal-green tracking-wide">
              NOMINAL
            </span>
          </div>
          <div className="text-[10px] text-terminal-subtext">
            WebSocket 1:1 Live
          </div>
        </div>
      </div>

      {/* Website Traffic & Visitor Telemetry Panel */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden shadow-xl">
        <div className="bg-terminal-card px-5 py-3.5 border-b border-terminal-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-terminal-gold" />
            <span className="font-extrabold text-white tracking-wider text-xs uppercase">
              WEBSITE VISITOR & TRAFFIC TELEMETRY
            </span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-terminal-subtext">
            <span>
              Conversion Rate:{" "}
              <strong className="text-terminal-gold">
                {uniqueVisitorsTotal > 0
                  ? ((totalUsers / uniqueVisitorsTotal) * 100).toFixed(1)
                  : 0}
                %
              </strong>
            </span>
            <span className="hidden sm:inline">
              Real-Time Neon DB Stream
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Visited Routes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 uppercase tracking-wider border-b border-terminal-border pb-2">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-terminal-gold" /> Top Visited Routes
              </span>
              <span>Hits</span>
            </div>
            <div className="space-y-2">
              {topPagesResult.length === 0 ? (
                <p className="text-[11px] text-terminal-subtext py-3 text-center">
                  Awaiting visitor traffic telemetry...
                </p>
              ) : (
                topPagesResult.map((p) => {
                  const percentage =
                    totalVisits > 0
                      ? Math.round((p._count.id / totalVisits) * 100)
                      : 0;
                  return (
                    <div key={p.path} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-200 font-bold">{p.path}</span>
                        <span className="text-terminal-gold font-bold">
                          {p._count.id}{" "}
                          <span className="text-[10px] text-terminal-subtext">
                            ({percentage}%)
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-terminal-black rounded-full h-1.5 overflow-hidden border border-terminal-border">
                        <div
                          className="bg-gradient-to-r from-terminal-gold to-amber-300 h-1.5 rounded-full"
                          style={{ width: `${Math.max(percentage, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Visitor Activity Stream */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 uppercase tracking-wider border-b border-terminal-border pb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-terminal-green" /> Recent Visitor Stream
              </span>
              <span>Timestamp</span>
            </div>
            <div className="space-y-2">
              {recentVisits.length === 0 ? (
                <p className="text-[11px] text-terminal-subtext py-3 text-center">
                  No visits recorded yet.
                </p>
              ) : (
                recentVisits.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between text-[11px] bg-terminal-black/50 p-2 rounded border border-terminal-border"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[70%]">
                      <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
                      <span className="font-bold text-white">{v.path}</span>
                      {v.referrer && (
                        <span className="text-[10px] text-terminal-subtext truncate hidden sm:inline">
                          via {v.referrer}
                        </span>
                      )}
                    </div>
                    <span className="text-terminal-subtext text-[10px] tabular-nums shrink-0">
                      {new Date(v.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
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
