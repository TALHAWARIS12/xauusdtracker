"use client";

import { Table2 } from "lucide-react";
import {
  formatBillions,
  formatInt,
  formatZone,
  type PositionRow,
} from "@/lib/market/terminal-model";

interface PositionTableProps {
  rows: PositionRow[];
}

const COLUMNS = ["Side", "Open Traders", "Entry Zone", "Stop-Loss Zone", "Take-Profit Zone", "Notional USD"];

export function PositionTable({ rows }: PositionTableProps) {
  return (
    <section
      aria-label="Position breakdown"
      className="bg-terminal-surface border border-terminal-border rounded-lg overflow-hidden relative"
    >
      <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card flex items-center justify-between">
        <h2 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider">
          <Table2 className="w-4 h-4 text-terminal-gold" />
          POSITION BREAKDOWN
        </h2>
        <span className="text-[10px] text-terminal-subtext">LIVE · RECALCULATED PER TICK</span>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-terminal-subtext border-b border-terminal-border">
              {COLUMNS.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-4 py-2 font-semibold whitespace-nowrap ${i === COLUMNS.length - 1 ? "text-right" : ""}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border/50 font-mono tabular-nums">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-6 text-center text-terminal-subtext">
                  Awaiting market data…
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const buy = row.side === "BUYERS";
                return (
                  <tr key={row.side} className="hover:bg-terminal-card/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold tracking-wider ${
                          buy
                            ? "bg-terminal-green/10 border-terminal-green/40 text-terminal-green"
                            : "bg-terminal-red/10 border-terminal-red/40 text-terminal-red"
                        }`}
                      >
                        {buy ? "▲ LONG" : "▼ SHORT"} · {row.side}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-bold whitespace-nowrap">
                      {row.traders !== null ? formatInt(row.traders) : "••••••"}
                    </td>
                    <td className="px-4 py-3 text-gray-200 whitespace-nowrap">{formatZone(row.entry)}</td>
                    <td className="px-4 py-3 text-terminal-red whitespace-nowrap">{formatZone(row.stopLoss)}</td>
                    <td className="px-4 py-3 text-terminal-green whitespace-nowrap">
                      {formatZone(row.takeProfit)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-terminal-gold whitespace-nowrap">
                      {row.notionalBillion !== null ? formatBillions(row.notionalBillion) : "••••••"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
