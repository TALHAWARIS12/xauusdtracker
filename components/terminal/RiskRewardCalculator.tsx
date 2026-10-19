"use client";

import { useState, useMemo } from "react";
import { Calculator, DollarSign, Percent, ShieldCheck, AlertCircle } from "lucide-react";
import { calculateRiskReward } from "@/lib/market/calculator";

interface RiskRewardCalculatorProps {
  currentPrice?: number;
}

export function RiskRewardCalculator({ currentPrice = 2715.0 }: RiskRewardCalculatorProps) {
  const [entry, setEntry] = useState<string>(currentPrice > 0 ? currentPrice.toFixed(2) : "2715.00");
  const [stopLoss, setStopLoss] = useState<string>((currentPrice > 0 ? currentPrice - 10 : 2705.0).toFixed(2));
  const [takeProfit, setTakeProfit] = useState<string>((currentPrice > 0 ? currentPrice + 22 : 2737.0).toFixed(2));
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
      aria-label="Risk Reward and Position Sizing Calculator"
      className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden flex flex-col"
    >
      <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-terminal-gold" />
          <h2 className="text-xs font-bold text-white tracking-wider">
            RISK / REWARD & POSITION SIZING CALCULATOR
          </h2>
        </div>
        <button
          onClick={handleSyncPrice}
          className="text-[10px] text-terminal-gold hover:underline font-bold cursor-pointer"
        >
          [SYNC SPOT: ${currentPrice.toFixed(2)}]
        </button>
      </header>

      <div className="p-4 space-y-4 text-xs font-mono">
        {/* Input Fields Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Entry Price */}
          <div>
            <label className="block text-[10px] text-terminal-subtext uppercase font-bold mb-1">
              ENTRY PRICE ($)
            </label>
            <input
              type="number"
              step="0.1"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="w-full bg-terminal-black border border-terminal-border focus:border-terminal-gold rounded px-3 py-1.5 text-xs text-white outline-none tabular-nums"
            />
          </div>

          {/* Stop Loss */}
          <div>
            <label className="block text-[10px] text-terminal-red uppercase font-bold mb-1">
              STOP-LOSS ($)
            </label>
            <input
              type="number"
              step="0.1"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-terminal-black border border-terminal-border focus:border-terminal-red rounded px-3 py-1.5 text-xs text-terminal-red outline-none tabular-nums"
            />
          </div>

          {/* Take Profit */}
          <div>
            <label className="block text-[10px] text-terminal-green uppercase font-bold mb-1">
              TAKE-PROFIT ($)
            </label>
            <input
              type="number"
              step="0.1"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              className="w-full bg-terminal-black border border-terminal-border focus:border-terminal-green rounded px-3 py-1.5 text-xs text-terminal-green outline-none tabular-nums"
            />
          </div>

          {/* Account Balance */}
          <div>
            <label className="block text-[10px] text-terminal-subtext uppercase font-bold mb-1">
              ACCOUNT BALANCE ($)
            </label>
            <div className="relative">
              <input
                type="number"
                step="100"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="10000"
                className="w-full bg-terminal-black border border-terminal-border focus:border-terminal-gold rounded px-3 py-1.5 text-xs text-gray-200 outline-none tabular-nums"
              />
            </div>
          </div>

          {/* Risk Percentage */}
          <div>
            <label className="block text-[10px] text-terminal-subtext uppercase font-bold mb-1">
              CHOSEN RISK (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              placeholder="1.0"
              className="w-full bg-terminal-black border border-terminal-border focus:border-terminal-gold rounded px-3 py-1.5 text-xs text-terminal-gold outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Results Box */}
        {calculation.isValid ? (
          <div className="bg-terminal-card border border-terminal-border/80 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-terminal-border/50 pb-2">
              <span className="font-bold text-white text-xs flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase border ${
                    calculation.direction === "LONG"
                      ? "bg-terminal-green/20 text-terminal-green border-terminal-green/40"
                      : "bg-terminal-red/20 text-terminal-red border-terminal-red/40"
                  }`}
                >
                  {calculation.direction} SETUP
                </span>
                <span>QUANTITATIVE METRICS</span>
              </span>

              <div className="text-right">
                <span className="text-[10px] text-terminal-subtext mr-1">R:R RATIO:</span>
                <span className="text-sm font-extrabold text-terminal-gold tabular-nums">
                  1 : {calculation.rewardToRiskRatio.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-terminal-subtext block">STOP DISTANCE:</span>
                <span className="font-bold text-terminal-red tabular-nums">
                  ${calculation.stopDistanceUsd.toFixed(2)} ({calculation.stopDistancePips} pips)
                </span>
              </div>
              <div>
                <span className="text-terminal-subtext block">TARGET DISTANCE:</span>
                <span className="font-bold text-terminal-green tabular-nums">
                  ${calculation.targetDistanceUsd.toFixed(2)} ({calculation.targetDistancePips} pips)
                </span>
              </div>
              <div>
                <span className="text-terminal-subtext block">MONETARY RISK ($):</span>
                <span className="font-bold text-white tabular-nums">
                  {calculation.riskAmountUsd !== undefined ? `$${calculation.riskAmountUsd.toFixed(2)}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-terminal-subtext block">RECOMMENDED LOTS:</span>
                <span className="font-extrabold text-terminal-gold tabular-nums">
                  {calculation.estimatedLots !== undefined ? `${calculation.estimatedLots} lots` : "—"}
                  <span className="text-[10px] text-terminal-subtext font-normal ml-1">
                    ({calculation.estimatedOunces} oz)
                  </span>
                </span>
              </div>
            </div>

            <div className="text-[10px] text-terminal-subtext border-t border-terminal-border/40 pt-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-terminal-green" />
              <span>
                Standard XAU/USD Contract: 100 Troy Ounces per lot. Verify your broker leverage & margin requirements.
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-terminal-red/10 border border-terminal-red/40 rounded p-3 text-terminal-red text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{calculation.errorMessage}</span>
          </div>
        )}
      </div>
    </section>
  );
}
