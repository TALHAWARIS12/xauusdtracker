"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Gift,
  Copy,
  Check,
  TrendingUp,
  Users,
  DollarSign,
  CalendarDays,
  ExternalLink,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { generateReferralCode } from "@/actions/referral-actions";

interface ReferralEarning {
  id: string;
  referredUserId: string;
  commissionUsd: number;
  rewardDays: number;
  status: string;
  createdAt: string;
  grantedAt: string | null;
}

interface ReferralPanelProps {
  initialCode: string | null;
  totalReferrals: number;
  activeReferrals: number;
  totalRewardDays: number;
  totalCommissionUsd: number;
  earnings: ReferralEarning[];
  appUrl: string;
}

const COMMISSION_PERCENT = 20;
const REWARD_DAYS = 7;

export function ReferralPanel({
  initialCode,
  totalReferrals,
  activeReferrals,
  totalRewardDays,
  totalCommissionUsd,
  earnings,
  appUrl,
}: ReferralPanelProps) {
  const [code, setCode] = useState<string | null>(initialCode);
  const [copied, setCopied] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [isPending, startTransition] = useTransition();

  const referralLink = code ? `${appUrl}/register?ref=${code}` : null;

  const handleGenerateCode = () => {
    startTransition(async () => {
      const result = await generateReferralCode();
      if (result.success && result.code) {
        setCode(result.code);
      }
    });
  };

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

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

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 text-white font-bold text-xs uppercase border-b border-white/[0.06] pb-3">
        <Gift className="h-4 w-4 text-gold-300" />
        <span>Refer &amp; Earn</span>
        <span className="ml-auto text-[10px] font-normal text-slate-400 normal-case">
          Earn {REWARD_DAYS} free days + {COMMISSION_PERCENT}% commission per subscriber
        </span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: <Users className="h-3.5 w-3.5" />,
            label: "Total Referrals",
            value: totalReferrals,
            color: "text-slate-300",
          },
          {
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            label: "Converted",
            value: activeReferrals,
            color: "text-bull-300",
          },
          {
            icon: <CalendarDays className="h-3.5 w-3.5" />,
            label: "Free Days Earned",
            value: `+${totalRewardDays}d`,
            color: "text-gold-300",
          },
          {
            icon: <DollarSign className="h-3.5 w-3.5" />,
            label: "Commission USD",
            value: `$${totalCommissionUsd.toFixed(2)}`,
            color: "text-gold-300",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1"
          >
            <div className={`flex items-center gap-1 text-[10px] text-slate-400`}>
              {stat.icon}
              {stat.label}
            </div>
            <div className={`text-lg font-extrabold tabular-nums ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Referral Link Block */}
      <div className="space-y-2">
        <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
          Your Referral Link
        </p>

        {code ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 overflow-hidden">
              <span className="text-[11px] text-slate-300 font-mono truncate flex-1">
                {referralLink}
              </span>
              <span className="shrink-0 rounded bg-white/[0.05] border border-white/10 px-1.5 py-0.5 text-[10px] font-bold text-gold-300 font-mono tracking-widest">
                {code}
              </span>
            </div>
            <button
              onClick={handleCopy}
              title="Copy referral link"
              className="shrink-0 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2.5 text-xs font-semibold text-slate-300 hover:text-white transition-all"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-bull-300" />
                  <span className="text-bull-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-4 text-center space-y-3">
            <p className="text-xs text-slate-400">
              Generate your unique referral link and start earning rewards every time someone subscribes through your link.
            </p>
            <button
              onClick={handleGenerateCode}
              disabled={isPending}
              className="inline-flex items-center gap-2 btn-primary px-5 py-2 text-xs font-semibold shadow-gold disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Gift className="h-3.5 w-3.5" />
                  <span>Generate My Referral Link</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          {[
            { step: "01", text: `Share your unique link with traders` },
            { step: "02", text: `They sign up using your referral link` },
            { step: "03", text: `When they subscribe, you get +${REWARD_DAYS} free days & ${COMMISSION_PERCENT}% commission` },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-2">
              <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gold-400/10 border border-gold-300/30 text-[10px] font-extrabold text-gold-300">
                {step}
              </span>
              <span className="leading-tight text-[11px]">{text}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
          Commissions are tracked and paid out manually by the admin team via crypto. Free days are granted automatically upon confirmed payment.
        </p>
      </div>

      {/* Earnings History Toggle */}
      {earnings.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowEarnings((v) => !v)}
            className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition border-t border-white/[0.06] pt-3"
          >
            <span>Referral Earnings History ({earnings.length})</span>
            {showEarnings ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showEarnings && (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-slate-400">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Commission</th>
                    <th className="px-3 py-2">Reward Days</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Granted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] text-slate-300">
                  {earnings.map((e) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2.5 text-slate-400">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 font-bold text-gold-300">
                        ${e.commissionUsd.toFixed(2)}
                      </td>
                      <td className="px-3 py-2.5 text-bull-300 font-semibold">
                        +{e.rewardDays}d
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor(e.status)}`}
                        >
                          {e.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-400">
                        {e.grantedAt
                          ? new Date(e.grantedAt).toLocaleDateString()
                          : "—"}
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

