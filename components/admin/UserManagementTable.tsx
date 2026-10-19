"use client";

import { useState, useTransition } from "react";
import { grantManualVip, revokeVip } from "@/actions/admin-actions";
import { CheckCircle2, XCircle, ShieldCheck, UserX, Loader2, Calendar } from "lucide-react";

export interface AdminUserItem {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  subscriptionStatus: "ACTIVE" | "INACTIVE" | "CANCELED";
  currentPeriodEnd: string | null;
  createdAt: string;
}

interface UserManagementTableProps {
  users: AdminUserItem[];
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleGrant = (userId: string, email: string) => {
    setActiveActionId(`grant-${userId}`);
    setMessage(null);
    startTransition(async () => {
      try {
        await grantManualVip(userId);
        setMessage({ text: `Granted 30-day VIP pass to ${email}`, type: "success" });
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : "Failed to grant VIP",
          type: "error",
        });
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const handleRevoke = (userId: string, email: string) => {
    setActiveActionId(`revoke-${userId}`);
    setMessage(null);
    startTransition(async () => {
      try {
        await revokeVip(userId);
        setMessage({ text: `Revoked VIP status for ${email}`, type: "success" });
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : "Failed to revoke VIP",
          type: "error",
        });
      } finally {
        setActiveActionId(null);
      }
    });
  };

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-mono border flex items-center gap-2 ${
            message.type === "success"
              ? "bg-terminal-green/10 border-terminal-green/30 text-terminal-green"
              : "bg-terminal-red/10 border-terminal-red/30 text-terminal-red"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono">
          <thead>
            <tr className="text-terminal-subtext border-b border-terminal-border text-[11px] uppercase tracking-wider">
              <th className="pb-3 px-3">Email</th>
              <th className="pb-3 px-3">Role</th>
              <th className="pb-3 px-3">Subscription Status</th>
              <th className="pb-3 px-3">Current Period Expiry</th>
              <th className="pb-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border/40 text-xs">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-terminal-subtext">
                  No registered users detected in database.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const isActive = u.subscriptionStatus === "ACTIVE";
                const isGranting = activeActionId === `grant-${u.id}`;
                const isRevoking = activeActionId === `revoke-${u.id}`;

                return (
                  <tr key={u.id} className="hover:bg-terminal-card/50 transition-colors">
                    {/* Email */}
                    <td className="py-3 px-3 font-bold text-white">
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        <span className="text-[10px] text-terminal-subtext font-normal">
                          UID: {u.id.slice(0, 12)}...
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-extrabold tracking-wider uppercase border ${
                          u.role === "ADMIN"
                            ? "bg-terminal-gold/20 text-terminal-gold border-terminal-gold/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
                            : "bg-terminal-card text-gray-300 border-terminal-border"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Subscription Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                          isActive
                            ? "bg-terminal-green/20 text-terminal-green border-terminal-green/40 shadow-[0_0_8px_rgba(0,230,118,0.2)]"
                            : u.subscriptionStatus === "CANCELED"
                            ? "bg-terminal-red/20 text-terminal-red border-terminal-red/40"
                            : "bg-terminal-black text-terminal-subtext border-terminal-border"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive
                              ? "bg-terminal-green animate-pulse"
                              : u.subscriptionStatus === "CANCELED"
                              ? "bg-terminal-red"
                              : "bg-gray-500"
                          }`}
                        />
                        {u.subscriptionStatus}
                      </span>
                    </td>

                    {/* Current Period Expiry */}
                    <td className="py-3 px-3 text-terminal-subtext text-[11px] tabular-nums">
                      {u.currentPeriodEnd ? (
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <Calendar className="w-3.5 h-3.5 text-terminal-gold" />
                          <span>{new Date(u.currentPeriodEnd).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">— None —</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Grant Manual VIP Button */}
                        <button
                          onClick={() => handleGrant(u.id, u.email)}
                          disabled={isPending}
                          className={`px-2.5 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase border transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                            isActive
                              ? "bg-terminal-card hover:bg-terminal-gold/20 text-terminal-gold border-terminal-border hover:border-terminal-gold/40"
                              : "bg-terminal-gold hover:bg-amber-400 text-terminal-black border-terminal-gold shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                          }`}
                          title="Grant 30-day VIP terminal access without requiring credit card"
                        >
                          {isGranting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          <span>{isActive ? "RENEW VIP (+30D)" : "GRANT 30-DAY VIP"}</span>
                        </button>

                        {/* Revoke VIP Button */}
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(u.id, u.email)}
                            disabled={isPending}
                            className="px-2.5 py-1.5 rounded text-[11px] font-bold tracking-wider uppercase bg-terminal-black hover:bg-terminal-red/20 text-terminal-red border border-terminal-red/30 hover:border-terminal-red/60 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Revoke subscription clearance immediately"
                          >
                            {isRevoking ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            <span>REVOKE</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
