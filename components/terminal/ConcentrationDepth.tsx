"use client";

import { Crosshair } from "lucide-react";
import { formatInt, formatZone, type DepthRow } from "@/lib/market/terminal-model";

interface ConcentrationDepthProps {
  rows: DepthRow[];
  currentPrice: number;
}

export function ConcentrationDepth({ rows, currentPrice }: ConcentrationDepthProps) {
  return (
    <section
      aria-label="Order flow concentration depth"
      className="bg-terminal-surface border border-terminal-border rounded-lg flex flex-col h-full relative"
    >
      <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card rounded-t-lg flex items-center justify-between">
        <h2 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider">
          <Crosshair className="w-4 h-4 text-terminal-gold" />
          CONCENTRATION DEPTH
        </h2>
        <span className="text-[10px] text-terminal-subtext">SL / TP CLUSTERS</span>
      </header>

      <div className="flex-1 p-3 flex flex-col gap-3">
        {rows.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[86px] rounded border border-terminal-border bg-terminal-card/40 animate-pulse"
              />
            ))
          : rows.map((row) => <DepthCard key={row.key} row={row} currentPrice={currentPrice} />)}
      </div>
    </section>
  );
}

function DepthCard({ row, currentPrice }: { row: DepthRow; currentPrice: number }) {
  const green = row.tone === "green";
  const text = green ? "text-terminal-green" : "text-terminal-red";
  const bar = green ? "bg-terminal-green" : "bg-terminal-red";
  const glow = green ? "shadow-[0_0_8px_#00E676]" : "shadow-[0_0_8px_#FF334B]";

  const zoneMid = row.zone ? (row.zone.min + row.zone.max) / 2 : 0;
  const distancePct =
    row.zone && currentPrice > 0 ? ((zoneMid - currentPrice) / currentPrice) * 100 : null;

  return (
    <article className="rounded border border-terminal-border bg-terminal-card/60 p-3 hover:border-terminal-gold/50 transition-colors">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-widest ${text}`}>{row.label}</span>
        <span className="text-[10px] text-terminal-subtext tabular-nums">
          {distancePct !== null ? `${distancePct >= 0 ? "+" : ""}${distancePct.toFixed(2)}%` : "—"}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between">
        <span className="text-sm font-bold text-white tabular-nums">{formatZone(row.zone)}</span>
        <span className={`text-xs font-bold tabular-nums ${text}`}>
          {row.traders !== null ? formatInt(row.traders) : "••••••"}{" "}
          <span className="text-terminal-subtext font-normal">traders</span>
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full rounded-full bg-terminal-black overflow-hidden">
        <div
          className={`h-full rounded-full ${bar} ${glow} transition-[width] duration-700 ease-out`}
          style={{ width: `${row.widthPct}%` }}
        />
      </div>
    </article>
  );
}
