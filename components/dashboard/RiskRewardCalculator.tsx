"use client";

import { useState, useMemo } from "react";
import { Calculator, ShieldCheck, AlertCircle } from "lucide-react";
import { calculateRiskReward } from "@/lib/market/calculator";

interface RiskRewardCalculatorProps {
  currentPrice?: number;
}

export function RiskRewardCalculator({ currentPrice = 4140.0 }: RiskRewardCalculatorProps) {
  const defaultPrice = currentPrice > 1000 ? currentPrice : 4140.0;
  const [entry, setEntry] = useState<string>(defaultPrice.toFixed(2));
  const [stopLoss, setStopLoss] = useState<string>((defaultPrice - 12.0).toFixed(2));
  const [takeProfit, setTakeProfit] = useState<string>((defaultPrice + 28.0).toFixed(2));
  const [balance, setBalance] = useState<string>("10000");
  const [riskPct, setRiskPct] = useState<string>("1.0");

  const calculation = useMemo(() => {
    const entryNum = parseFloat(entry);
    const slNum = parseFloat(stopLoss);
    const tpNum = parseFloat(takeProfit);
    const balNum = parseFloat(balance);
    const riskNum = parseFloat(riskPct);

    return calculateRiskReward({
      entryPrice: entryNum,
      stopLossPrice: slNum,
      takeProfitPrice: tpNum,
      accountBalance: Number.isFinite(balNum) && balNum > 0 ? balNum : undefined,
      riskPercent: Number.isFinite(riskNum) && riskNum > 0 ? riskNum : undefined,
    });
  }, [entry, stopLoss, takeProfit, balance, riskPct]);

  const handleSyncPrice = () => {
    if (currentPrice > 0) {
      setEntry(currentPrice.toFixed(2));
      setStopLoss((currentPrice - 8.5).toFixed(2));
      setTakeProfit((currentPrice + 19.5).toFixed(2));
    }
  };

  return (
    <section
      aria-label="Position sizing and risk calculator"
      className="card overflow-hidden"
      id="risk-reward-calculator"
    >
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
            <Calculator className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Risk / Reward & Lot Sizing Calculator</h2>
            <p className="text-[11px] text-slate-400">Position calibration for standard 100 oz gold contracts</p>
          </div>
        </div>
        <button
          onClick={handleSyncPrice}
          type="button"
          className="rounded-lg border border-gold-300/30 bg-gold-300/10 px-2.5 py-1 text-xs font-semibold text-gold-300 hover:bg-gold-300/20 transition-colors"
        >
          Sync Current Price (${currentPrice.toFixed(2)})
        </button>
      </header>

      <div className="p-6 space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div>
            <label className="label">Entry Price ($)</label>
            <input
              type="number"
              step="0.1"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="input tabular"
            />
          </div>

          <div>
            <label className="label text-bear-300">Stop-Loss ($)</label>
            <input
              type="number"
              step="0.1"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="input tabular text-bear-300 focus:border-bear-400/60 focus:ring-bear-400/10"
            />
          </div>

          <div>
            <label className="label text-bull-300">Take-Profit ($)</label>
            <input
              type="number"
              step="0.1"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="input tabular text-bull-300 focus:border-bull-400/60 focus:ring-bull-400/10"
            />
          </div>

          <div>
            <label className="label">Account Balance ($)</label>
            <input
              type="number"
              step="100"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="input tabular"
              placeholder="10000"
            />
          </div>

          <div>
            <label className="label text-gold-300">Max Risk (%)</label>
            <input
              type="number"
              step="0.5"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              className="input tabular text-gold-300"
              placeholder="1.0"
            />
          </div>
        </div>

        {/* Results Card */}
        {calculation.isValid ? (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <span className="flex items-center gap-2">
                <span
                  className={`badge font-bold uppercase ${
                    calculation.direction === "LONG"
                      ? "bg-bull-400/10 text-bull-300 border border-bull-400/30"
                      : "bg-bear-400/10 text-bear-300 border border-bear-400/30"
                  }`}
                >
                  {calculation.direction} Position
                </span>
                <span className="text-sm font-semibold text-white">Calculated Metrics</span>
              </span>

              <div className="text-right">
                <span className="text-xs text-slate-400 mr-2">Target Ratio:</span>
                <span className="font-display text-lg font-bold text-gold-300 tabular">
                  1 : {calculation.rewardToRiskRatio.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="card-muted p-3">
                <span className="text-slate-400 block mb-0.5">Stop Distance</span>
                <span className="font-display text-base font-bold text-bear-300 tabular block">
                  ${calculation.stopDistanceUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500">{calculation.stopDistancePips} pips</span>
              </div>

              <div className="card-muted p-3">
                <span className="text-slate-400 block mb-0.5">Target Distance</span>
                <span className="font-display text-base font-bold text-bull-300 tabular block">
                  ${calculation.targetDistanceUsd.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-500">{calculation.targetDistancePips} pips</span>
              </div>

              <div className="card-muted p-3">
                <span className="text-slate-400 block mb-0.5">Monetary Risk</span>
                <span className="font-display text-base font-bold text-white tabular block">
                  {calculation.riskAmountUsd !== undefined ? `$${calculation.riskAmountUsd.toFixed(2)}` : "—"}
                </span>
                <span className="text-[11px] text-slate-500">{riskPct}% of balance</span>
              </div>

              <div className="card-muted p-3">
                <span className="text-slate-400 block mb-0.5">Recommended Sizing</span>
                <span className="font-display text-base font-bold text-gold-300 tabular block">
                  {calculation.estimatedLots !== undefined ? `${calculation.estimatedLots} lots` : "—"}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {calculation.estimatedOunces} troy oz
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-bull-400 shrink-0" />
              <span>Standard Gold Contract: 100 troy ounces per 1.00 lot. Verify broker margin and leverage.</span>
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-bear-400/30 bg-bear-400/10 p-4 text-xs text-bear-300 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{calculation.errorMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}
