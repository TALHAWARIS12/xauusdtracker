"use client";

import { TableProperties } from "lucide-react";
import { formatBillions, formatInt, formatZone, type PositionRow } from "@/lib/market/terminal-model";

interface PositionFlowTableProps {
  rows: PositionRow[];
  isSubscribed: boolean;
}

const COLUMNS = ["Market Side", "Trader Count", "Entry Range", "Stop-Loss Level", "Take-Profit Target", "Estimated Volume"];

export function PositionFlowTable({ rows, isSubscribed }: PositionFlowTableProps) {
  const displayRows: PositionRow[] =
    !isSubscribed || rows.length === 0
      ? [
          { side: "BUYERS", traders: 165000, entry: { min: 2710, max: 2715 }, stopLoss: { min: 2704, max: 2708 }, takeProfit: { min: 2742, max: 2748 }, notionalBillion: 52.4 },
          { side: "SELLERS", traders: 82000, entry: { min: 2715, max: 2720 }, stopLoss: { min: 2728, max: 2732 }, takeProfit: { min: 2692, max: 2696 }, notionalBillion: 28.1 },
        ]
      : rows;

  return (
    <section aria-label="Market positioning breakdown" className="card relative overflow-hidden" id="position-flow-table">
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
            <TableProperties className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Institutional Position Flow</h2>
            <p className="text-[11px] text-slate-400">Aggregated buyer vs. seller distribution</p>
          </div>
        </div>
        <span className="badge border border-white/10 bg-white/[0.04] text-[11px] text-slate-300">
          Real-Time Model
        </span>
      </header>

      <div className={`overflow-x-auto p-2 ${!isSubscribed ? "filter blur-[4px] select-none pointer-events-none" : ""}`}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] text-xs font-semibold text-slate-400">
              {COLUMNS.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-4 py-3 whitespace-nowrap ${i === COLUMNS.length - 1 ? "text-right" : ""}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-slate-200">
            {displayRows.map((row) => {
              const buy = row.side === "BUYERS";
              return (
                <tr key={row.side} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        buy ? "bg-bull-400/10 text-bull-300 border border-bull-400/20" : "bg-bear-400/10 text-bear-300 border border-bear-400/20"
                      }`}
                    >
                      {buy ? "▲ Buyers (Long)" : "▼ Sellers (Short)"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-white tabular whitespace-nowrap">
                    {row.traders !== null ? formatInt(row.traders) : "••••••"}
                  </td>
                  <td className="px-4 py-3.5 text-slate-300 tabular whitespace-nowrap">
                    {formatZone(row.entry)}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-bear-300 tabular whitespace-nowrap">
                    {formatZone(row.stopLoss)}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-bull-300 tabular whitespace-nowrap">
                    {formatZone(row.takeProfit)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-gold-300 tabular whitespace-nowrap">
                    {row.notionalBillion !== null ? formatBillions(row.notionalBillion) : "••••••"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isSubscribed && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink-950/40 backdrop-blur-[2px]">
          <span className="badge-pro px-4 py-2 text-xs font-semibold shadow-gold">
            Proprietary Liquidity Zones Locked · Subscribe to Reveal
          </span>
        </div>
      )}
    </section>
  );
}
