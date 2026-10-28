"use client";

import { useState, useTransition, useMemo } from "react";
import { grantManualVip, revokeVip, adminResetPassword } from "@/actions/admin-actions";
import { CheckCircle2, XCircle, ShieldCheck, UserX, Loader2, Calendar, Search, Filter, Key, Copy } from "lucide-react";

export interface AdminUserItem {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  subscriptionStatus: "ACTIVE" | "INACTIVE" | "CANCELED";
  subscriptionSource: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

interface UserManagementTableProps {
  users: AdminUserItem[];
}

export function UserManagementTable({ users }: UserManagementTableProps) {
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "CANCELED" | "MANUAL">("ALL");
  const [reasonInput, setReasonInput] = useState<{ [userId: string]: string }>({});
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === "ALL") return true;
      if (statusFilter === "ACTIVE") return u.subscriptionStatus === "ACTIVE";
      if (statusFilter === "INACTIVE") return u.subscriptionStatus === "INACTIVE";
      if (statusFilter === "CANCELED") return u.subscriptionStatus === "CANCELED";
      if (statusFilter === "MANUAL") return u.subscriptionSource === "MANUAL_OVERRIDE";
      return true;
    });
  }, [users, searchQuery, statusFilter]);

  const handleGrant = (userId: string, email: string) => {
    const reason = reasonInput[userId] || "Admin manual override clearance granted.";
    setActiveActionId(`grant-${userId}`);
    setMessage(null);

    startTransition(async () => {
      try {
        await grantManualVip(userId, reason);
        setMessage({ text: `Granted 30-day VIP pass to ${email} (Reason: ${reason})`, type: "success" });
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
    const reason = reasonInput[userId] || "Admin manual VIP revocation.";
    setActiveActionId(`revoke-${userId}`);
    setMessage(null);

    startTransition(async () => {
      try {
        await revokeVip(userId, reason);
        setMessage({ text: `Revoked VIP clearance for ${email} (Reason: ${reason})`, type: "success" });
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

  const handleResetPassword = (userId: string, email: string) => {
    const customPass = reasonInput[userId];
    setActiveActionId(`reset-${userId}`);
    setMessage(null);

    startTransition(async () => {
      try {
        const res = await adminResetPassword(userId, customPass);
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(res.newPassword);
        }
        setMessage({
          text: `Passkey for ${email} reset to: "${res.newPassword}" (Copied to clipboard). Provide this to the operator.`,
          type: "success",
        });
      } catch (err) {
        setMessage({
          text: err instanceof Error ? err.message : "Failed to reset passkey",
          type: "error",
        });
      } finally {
        setActiveActionId(null);
      }
    });
  };


  return (
    <div className="space-y-4">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-terminal-card/80 p-3 rounded-lg border border-terminal-border">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-terminal-subtext absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search operator email or UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-terminal-surface border border-terminal-border focus:border-terminal-gold rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-terminal-subtext/50 outline-none font-mono"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[10px]">
          <span className="text-terminal-subtext mr-1 flex items-center gap-1 font-bold">
            <Filter className="w-3 h-3 text-terminal-gold" /> FILTER:
          </span>
          {(["ALL", "ACTIVE", "INACTIVE", "CANCELED", "MANUAL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-2 py-1 rounded font-bold uppercase transition cursor-pointer ${
                statusFilter === tab
                  ? "bg-terminal-gold text-terminal-black"
                  : "bg-terminal-surface text-terminal-subtext hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

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
              <th className="pb-3 px-3">Email & UID</th>
              <th className="pb-3 px-3">Role</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">Source</th>
              <th className="pb-3 px-3">Current Expiry</th>
              <th className="pb-3 px-3 text-right">Actions & Audit Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border/40 text-xs">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-terminal-subtext">
                  No operators match the current search / filter criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isActive = u.subscriptionStatus === "ACTIVE";
                const isGranting = activeActionId === `grant-${u.id}`;
                const isRevoking = activeActionId === `revoke-${u.id}`;
                const isResetting = activeActionId === `reset-${u.id}`;

                return (
                  <tr key={u.id} className="hover:bg-terminal-card/50 transition-colors">
                    {/* Email */}
                    <td className="py-3 px-3 font-bold text-white">
                      <div className="flex flex-col">
                        <span>{u.email}</span>
                        <span className="text-[10px] text-terminal-subtext font-normal">
                          UID: {u.id.slice(0, 14)}...
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

                    {/* Subscription Source */}
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                          u.subscriptionSource === "MANUAL_OVERRIDE"
                            ? "bg-terminal-gold/15 text-terminal-gold border-terminal-gold/30"
                            : "bg-terminal-card text-terminal-gold border-terminal-border"
                        }`}
                      >
                        {u.subscriptionSource === "MANUAL_OVERRIDE"
                          ? "VIP OVERRIDE"
                          : u.subscriptionSource === "NOWPAYMENTS" || u.subscriptionSource === "STRIPE"
                          ? "NOWPAYMENTS"
                          : u.subscriptionSource}
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
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                        {/* Audit Reason Input */}
                        <input
                          type="text"
                          placeholder="Audit reason..."
                          value={reasonInput[u.id] || ""}
                          onChange={(e) =>
                            setReasonInput((prev) => ({ ...prev, [u.id]: e.target.value }))
                          }
                          className="w-32 bg-terminal-black border border-terminal-border focus:border-terminal-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                        />

                        {/* Grant Manual VIP Button */}
                        <button
                          onClick={() => handleGrant(u.id, u.email)}
                          disabled={isPending}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
                          <span>{isActive ? "+30D" : "VIP"}</span>
                        </button>

                        {/* Reset Passkey Button */}
                        <button
                          onClick={() => handleResetPassword(u.id, u.email)}
                          disabled={isPending}
                          className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-terminal-card hover:bg-terminal-gold/20 text-terminal-gold border border-terminal-border hover:border-terminal-gold/40 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reset operator passkey (generates secure temporary password or uses custom text above)"
                        >
                          {isResetting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Key className="w-3 h-3" />
                          )}
                          <span>RESET PASS</span>
                        </button>

                        {/* Revoke VIP Button */}
                        {isActive && (
                          <button
                            onClick={() => handleRevoke(u.id, u.email)}
                            disabled={isPending}
                            className="px-2 py-1 rounded text-[10px] font-bold tracking-wider uppercase bg-terminal-black hover:bg-terminal-red/20 text-terminal-red border border-terminal-red/30 hover:border-terminal-red/60 transition flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
