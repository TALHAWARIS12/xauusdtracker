"use client";

import { DollarSign, CheckCircle2 } from "lucide-react";

export interface AdminPaymentItem {
  id: string;
  userEmail: string;
  provider: string;
  providerReference: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface PaymentHistoryTableProps {
  payments: AdminPaymentItem[];
}

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  return (
    <div className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden shadow-xl">
      <div className="bg-terminal-card px-5 py-3.5 border-b border-terminal-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <DollarSign className="w-4 h-4 text-terminal-gold" />
          <span className="font-extrabold text-white tracking-wider text-xs uppercase">
            PAYMENT TRANSACTIONS & RECONCILIATION
          </span>
        </div>
        <span className="text-[10px] text-terminal-subtext uppercase tracking-widest hidden sm:inline">
          NOWPayments Blockchain Logs
        </span>
      </div>

      <div className="p-4 sm:p-5 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="text-terminal-subtext border-b border-terminal-border text-[11px] uppercase tracking-wider">
              <th className="pb-3 px-3">Transaction Reference</th>
              <th className="pb-3 px-3">Operator Account</th>
              <th className="pb-3 px-3">Amount</th>
              <th className="pb-3 px-3">Provider</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3 text-right">Confirmed Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border/40">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-terminal-subtext">
                  No confirmed payment transactions recorded in database.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="hover:bg-terminal-card/50 transition-colors">
                  <td className="py-3 px-3 font-bold text-white tabular-nums">
                    {p.providerReference || p.id}
                  </td>
                  <td className="py-3 px-3 text-gray-300">{p.userEmail}</td>
                  <td className="py-3 px-3 font-bold text-terminal-gold tabular-nums">
                    ${p.amount.toFixed(2)} {p.currency}
                  </td>
                  <td className="py-3 px-3 text-terminal-subtext">{p.provider}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-terminal-green/20 text-terminal-green border border-terminal-green/40">
                      <CheckCircle2 className="w-3 h-3" />
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-terminal-subtext tabular-nums">
                    {new Date(p.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
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
