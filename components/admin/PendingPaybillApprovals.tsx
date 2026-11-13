"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Loader2,
  UserCheck,
  Smartphone,
  Mail,
} from "lucide-react";
import {
  approveManualPayment,
  rejectManualPayment,
  approveManualPaymentByEmail,
} from "@/actions/admin-actions";

export interface PendingManualPaymentItem {
  id: string;
  userId: string;
  userEmail: string;
  provider: string;
  providerReference: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  subscriptionStatus: string;
}

interface PendingPaybillApprovalsProps {
  pendingPayments: PendingManualPaymentItem[];
}

export function PendingPaybillApprovals({
  pendingPayments,
}: PendingPaybillApprovalsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Direct email approval form state
  const [directEmail, setDirectEmail] = useState("");
  const [directPlanId, setDirectPlanId] = useState<"monthly" | "yearly">("monthly");
  const [directRef, setDirectRef] = useState("");

  const handleApprove = (paymentId: string, email: string) => {
    setActiveId(`approve-${paymentId}`);
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await approveManualPayment(paymentId, notes[paymentId]);
        setFeedback({
          text: `Approved $${res.amount.toFixed(
            2
          )} Paybill payment for ${res.email}. Pro subscription is now ACTIVE.`,
          type: "success",
        });
        router.refresh();
      } catch (err) {
        setFeedback({
          text:
            err instanceof Error
              ? err.message
              : `Failed to approve payment for ${email}`,
          type: "error",
        });
      } finally {
        setActiveId(null);
      }
    });
  };

  const handleReject = (paymentId: string, email: string) => {
    setActiveId(`reject-${paymentId}`);
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await rejectManualPayment(paymentId, notes[paymentId]);
        setFeedback({
          text: `Marked Paybill submission for ${res.email} as REJECTED / FAILED.`,
          type: "success",
        });
        router.refresh();
      } catch (err) {
        setFeedback({
          text:
            err instanceof Error
              ? err.message
              : `Failed to reject payment for ${email}`,
          type: "error",
        });
      } finally {
        setActiveId(null);
      }
    });
  };

  const handleDirectApprove = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveId("direct-approve");
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await approveManualPaymentByEmail({
          email: directEmail,
          planId: directPlanId,
          reference: directRef,
        });
        setFeedback({
          text: `Approved ${res.planName} ($${res.amountUsd}) for ${res.email} (Ref: ${res.reference})${
            res.createdNewAccount ? " — New operator account created & activated." : " — Subscription activated."
          }`,
          type: "success",
        });
        setDirectEmail("");
        setDirectRef("");
        router.refresh();
      } catch (err) {
        setFeedback({
          text:
            err instanceof Error
              ? err.message
              : "Failed to approve customer by email.",
          type: "error",
        });
      } finally {
        setActiveId(null);
      }
    });
  };

  const getPlanLabel = (amount: number) => {
    if (amount >= 100) return "Yearly Pro (365d)";
    if (amount >= 8 && amount <= 15) return "Weekly Pass (7d)";
    return "Monthly Pro (30d)";
  };

  return (
    <div
      className="bg-terminal-surface border border-terminal-gold/40 rounded-lg overflow-hidden shadow-[0_0_25px_rgba(245,158,11,0.08)]"
      id="admin-paybill-approvals-section"
    >
      {/* Section Header */}
      <div className="bg-terminal-card px-5 py-3.5 border-b border-terminal-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Smartphone className="w-4 h-4 text-terminal-green" />
          <span className="font-extrabold text-white tracking-wider text-xs uppercase">
            MANUAL PAYMENT APPROVALS — M-PESA PAYBILL 919700 (ACC: 0018255401)
          </span>
          {pendingPayments.length > 0 ? (
            <span className="px-2 py-0.5 rounded bg-terminal-gold/20 text-terminal-gold border border-terminal-gold/40 text-[10px] font-extrabold tracking-widest uppercase animate-pulse">
              {pendingPayments.length} PENDING PROOF
              {pendingPayments.length === 1 ? "" : "S"}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-terminal-green/15 text-terminal-green border border-terminal-green/30 text-[10px] font-bold uppercase">
              0 PENDING
            </span>
          )}
        </div>
        <span className="text-[10px] text-terminal-subtext flex items-center gap-1">
          <Mail className="w-3 h-3 text-terminal-gold" />
          Proof Inbox: Support@xauusdtracker.com
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-5">
        {feedback && (
          <div
            className={`p-3 rounded-lg text-xs font-mono border flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-terminal-green/10 border-terminal-green/30 text-terminal-green"
                : "bg-terminal-red/10 border-terminal-red/30 text-terminal-red"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Pending Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-terminal-subtext border-b border-terminal-border text-[11px] uppercase tracking-wider">
                <th className="pb-3 px-3">Submitted</th>
                <th className="pb-3 px-3">Customer Email</th>
                <th className="pb-3 px-3">Plan &amp; Amount</th>
                <th className="pb-3 px-3">M-Pesa / Proof Ref</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Manual Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/40">
              {pendingPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-6 text-center text-terminal-subtext"
                  >
                    No pending Paybill submissions in queue. Check Support@xauusdtracker.com for emailed proofs or use Direct Approval below.
                  </td>
                </tr>
              ) : (
                pendingPayments.map((p) => {
                  const isApproving = activeId === `approve-${p.id}`;
                  const isRejecting = activeId === `reject-${p.id}`;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-terminal-card/50 transition-colors"
                    >
                      <td className="py-3 px-3 text-terminal-subtext tabular-nums whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        <div>{p.userEmail}</div>
                        <div className="text-[10px] text-terminal-subtext font-normal">
                          Order: {p.id}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-terminal-gold tabular-nums">
                          ${p.amount.toFixed(2)} {p.currency}
                        </div>
                        <div className="text-[10px] text-gray-300">
                          {getPlanLabel(p.amount)}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-white select-all">
                        {p.providerReference || "Awaiting email proof"}
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-terminal-gold/20 text-terminal-gold border border-terminal-gold/40">
                          <Clock className="w-3 h-3" />
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                          <input
                            type="text"
                            placeholder="Verification note..."
                            value={notes[p.id] || ""}
                            onChange={(e) =>
                              setNotes((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            className="w-36 bg-terminal-black border border-terminal-border focus:border-terminal-gold rounded px-2 py-1 text-[10px] text-white outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleApprove(p.id, p.userEmail)}
                            disabled={isPending}
                            className="px-3 py-1.5 rounded text-[10px] font-extrabold tracking-wider uppercase bg-terminal-green hover:bg-emerald-400 text-terminal-black border border-terminal-green transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            id={`approve-payment-${p.id}`}
                          >
                            {isApproving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ShieldCheck className="w-3.5 h-3.5" />
                            )}
                            <span>APPROVE &amp; ACTIVATE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(p.id, p.userEmail)}
                            disabled={isPending}
                            className="px-2.5 py-1.5 rounded text-[10px] font-bold tracking-wider uppercase bg-terminal-black hover:bg-terminal-red/20 text-terminal-red border border-terminal-red/30 hover:border-terminal-red/60 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            id={`reject-payment-${p.id}`}
                          >
                            {isRejecting ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>REJECT</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Direct Approval Form for Proofs Sent Straight to Support@xauusdtracker.com */}
        <form
          onSubmit={handleDirectApprove}
          className="rounded-lg border border-terminal-border bg-terminal-black/70 p-4 space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-terminal-gold flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5" />
              Direct Payment Approval (If User Emailed Proof to Support@xauusdtracker.com)
            </span>
            <span className="text-[10px] text-terminal-subtext">
              Creates/updates user, logs PAYBILL payment &amp; activates Pro immediately
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <input
              type="email"
              required
              placeholder="Customer email (e.g. trader@gmail.com)"
              value={directEmail}
              onChange={(e) => setDirectEmail(e.target.value)}
              className="sm:col-span-1 bg-terminal-surface border border-terminal-border focus:border-terminal-gold rounded px-3 py-2 text-xs text-white placeholder-terminal-subtext/60 outline-none"
              id="direct-approve-email"
            />
            <select
              value={directPlanId}
              onChange={(e) =>
                setDirectPlanId(e.target.value as "monthly" | "yearly")
              }
              className="bg-terminal-surface border border-terminal-border focus:border-terminal-gold rounded px-3 py-2 text-xs text-white outline-none"
              id="direct-approve-plan"
            >
              <option value="monthly">Monthly Pro — $48 (30 Days)</option>
              <option value="yearly">Yearly Pro — $188 (365 Days)</option>
            </select>
            <input
              type="text"
              placeholder="M-Pesa / Paybill Ref (optional)"
              value={directRef}
              onChange={(e) => setDirectRef(e.target.value)}
              className="bg-terminal-surface border border-terminal-border focus:border-terminal-gold rounded px-3 py-2 text-xs text-white placeholder-terminal-subtext/60 outline-none font-mono"
              id="direct-approve-ref"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded text-[11px] font-extrabold tracking-wider uppercase bg-terminal-gold hover:bg-amber-400 text-terminal-black transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              id="direct-approve-submit"
            >
              {activeId === "direct-approve" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>APPROVE &amp; ACTIVATE PRO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

