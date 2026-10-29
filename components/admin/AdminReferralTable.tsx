"use client";

import { Gift, TrendingUp, DollarSign, CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export interface AdminReferralItem {
  id: string;
  referrerEmail: string;
  referredUserId: string;
  commissionUsd: number;
  rewardDays: number;
  status: string;
  paymentId: string | null;
  createdAt: string;
  grantedAt: string | null;
}

interface AdminReferralTableProps {
  referrals: AdminReferralItem[];
  totalCommission: number;
  totalReferrers: number;
}

const statusColor = (status: string) => {
  switch (status) {
    case "GRANTED":
      return "bg-bull-400/10 text-bull-300 border-bull-400/30";
    case "PAID_OUT":
      return "bg-gold-400/10 text-gold-300 border-gold-400/30";
    default:
      return "bg-slate-400/10 text-slate-400 border-slate-400/20";
  }
};

export function AdminReferralTable({
  referrals,
  totalCommission,
  totalReferrers,
}: AdminReferralTableProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden shadow-xl">
      <div className="bg-terminal-card px-5 py-3.5 border-b border-terminal-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Gift className="w-4 h-4 text-terminal-gold" />
          <span className="font-extrabold text-white tracking-wider text-xs uppercase">
            REFERRAL PROGRAM LEDGER
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-[10px] text-terminal-subtext">
            <span>
              Total Referrers:{" "}
              <strong className="text-terminal-gold">{totalReferrers}</strong>
            </span>
            <span>
              Pending Commissions:{" "}
              <strong className="text-terminal-gold">
                ${totalCommission.toFixed(2)}
              </strong>
            </span>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-terminal-subtext hover:text-white transition"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 sm:p-5">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <div className="bg-terminal-black border border-terminal-border rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-terminal-subtext uppercase tracking-wider">
                <Gift className="w-3 h-3 text-terminal-gold" />
                Total Referrals
              </div>
              <div className="text-xl font-extrabold text-white tabular-nums">{referrals.length}</div>
            </div>
            <div className="bg-terminal-black border border-terminal-border rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-terminal-subtext uppercase tracking-wider">
                <TrendingUp className="w-3 h-3 text-terminal-green" />
                Converted
              </div>
              <div className="text-xl font-extrabold text-terminal-green tabular-nums">
                {referrals.filter((r) => r.status === "GRANTED" || r.status === "PAID_OUT").length}
              </div>
            </div>
            <div className="bg-terminal-black border border-terminal-border rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-terminal-subtext uppercase tracking-wider">
                <DollarSign className="w-3 h-3 text-terminal-gold" />
                Total Commission Owed
              </div>
              <div className="text-xl font-extrabold text-terminal-gold tabular-nums">
                ${referrals
                  .filter((r) => r.status === "GRANTED")
                  .reduce((s, r) => s + r.commissionUsd, 0)
                  .toFixed(2)}
              </div>
            </div>
          </div>

          {referrals.length === 0 ? (
            <p className="text-[11px] text-terminal-subtext text-center py-6">
              No referral earnings recorded yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-terminal-border text-terminal-subtext">
                    <th className="px-3 py-2 uppercase tracking-wider">Referrer</th>
                    <th className="px-3 py-2 uppercase tracking-wider">Commission</th>
                    <th className="px-3 py-2 uppercase tracking-wider">Reward Days</th>
                    <th className="px-3 py-2 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 uppercase tracking-wider">Date</th>
                    <th className="px-3 py-2 uppercase tracking-wider">Granted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/50 text-gray-300">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-terminal-black/30 transition">
                      <td className="px-3 py-2.5 font-medium text-white">{r.referrerEmail}</td>
                      <td className="px-3 py-2.5 font-bold text-terminal-gold">
                        ${r.commissionUsd.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-terminal-green font-semibold">
                        +{r.rewardDays}d
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor(r.status)}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-terminal-subtext">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 text-terminal-subtext">
                        {r.grantedAt ? new Date(r.grantedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

