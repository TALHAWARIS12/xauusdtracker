"use client";

import { ShieldAlert, Clock } from "lucide-react";

export interface AdminAuditItem {
  id: string;
  adminEmail: string;
  targetEmail: string;
  action: string;
  reason: string;
  createdAt: string;
}

interface AdminAuditLogTableProps {
  events: AdminAuditItem[];
}

export function AdminAuditLogTable({ events }: AdminAuditLogTableProps) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden shadow-xl">
      <div className="bg-terminal-card px-5 py-3.5 border-b border-terminal-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-terminal-gold" />
          <span className="font-extrabold text-white tracking-wider text-xs uppercase">
            ADMINISTRATIVE OVERRIDE AUDIT TRAIL
          </span>
        </div>
        <span className="text-[10px] text-terminal-subtext uppercase tracking-widest hidden sm:inline">
          Immutable Access Audit Events
        </span>
      </div>

      <div className="p-4 sm:p-5 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="text-terminal-subtext border-b border-terminal-border text-[11px] uppercase tracking-wider">
              <th className="pb-3 px-3">Timestamp</th>
              <th className="pb-3 px-3">Admin Actor</th>
              <th className="pb-3 px-3">Target Operator</th>
              <th className="pb-3 px-3">Action</th>
              <th className="pb-3 px-3">Stated Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border/40">
            {events.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-terminal-subtext">
                  No administrative override events recorded in audit trail.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="hover:bg-terminal-card/50 transition-colors">
                  <td className="py-3 px-3 text-terminal-subtext tabular-nums flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 text-terminal-gold" />
                    {new Date(e.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-3 text-white font-bold">{e.adminEmail}</td>
                  <td className="py-3 px-3 text-gray-300">{e.targetEmail}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                        e.action === "GRANT_MANUAL_VIP"
                          ? "bg-terminal-green/20 text-terminal-green border-terminal-green/40"
                          : e.action === "REVOKE_VIP"
                          ? "bg-terminal-red/20 text-terminal-red border-terminal-red/40"
                          : "bg-terminal-card text-terminal-subtext border-terminal-border"
                      }`}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-terminal-subtext max-w-xs truncate">
                    {e.reason}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
