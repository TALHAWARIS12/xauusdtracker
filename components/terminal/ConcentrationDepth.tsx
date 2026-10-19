"use client";

import { Crosshair, Info } from "lucide-react";
import { formatInt, formatZone, type DepthRow } from "@/lib/market/terminal-model";

interface ConcentrationDepthProps {
  rows: DepthRow[];
  currentPrice: number;
}

const ZONE_DESCRIPTIONS: Record<string, { standardLabel: string; basis: string; defaultScore: number }> = {
  buyerSL: {
    standardLabel: "POTENTIAL SL CONCENTRATION // BUYER HUNT",
    basis: "Modelled retail stop-loss cluster resting 0.2%-0.5% below recent 15-candle swing low.",
    defaultScore: 84,
  },
  buyerTP: {
    standardLabel: "MODELLED TP AREA // BUYER EXPANSION",
    basis: "Golden ratio Fibonacci 0.618 impulse extension above structural swing high.",
    defaultScore: 91,
  },
  sellerSL: {
    standardLabel: "POTENTIAL SL CONCENTRATION // SELLER HUNT",
    basis: "Modelled buy-stop liquidity pool resting 0.2%-0.5% above recent 15-candle swing high.",
    defaultScore: 82,
  },
  sellerTP: {
    standardLabel: "MODELLED TP AREA // SELLER EXPANSION",
    basis: "Golden ratio Fibonacci 0.618 impulse extension below structural swing low.",
    defaultScore: 88,
  },
};

export function ConcentrationDepth({ rows, currentPrice }: ConcentrationDepthProps) {
  return (
    <section
      aria-label="Order flow concentration depth"
      className="bg-terminal-surface border border-terminal-border rounded-lg flex flex-col h-full relative"
    >
      <header className="px-4 py-2.5 border-b border-terminal-border bg-terminal-card rounded-t-lg flex items-center justify-between">
        <h2 className="text-xs font-bold text-white flex items-center gap-2 tracking-wider">
          <Crosshair className="w-4 h-4 text-terminal-gold" />
          ESTIMATED LIQUIDITY CONCENTRATION
        </h2>
        <span className="text-[10px] text-terminal-subtext">STRUCTURAL ESTIMATES</span>
      </header>

      <div className="flex-1 p-3 flex flex-col gap-3">
        {rows.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[86px] rounded border border-terminal-border bg-terminal-card/40 animate-pulse"
              />
            ))
          : rows.map((row) => (
              <DepthCard
                key={row.key}
                row={row}
                currentPrice={currentPrice}
                meta={ZONE_DESCRIPTIONS[row.key] || {
                  standardLabel: row.label,
                  basis: "Algorithmic price structure estimate.",
                  defaultScore: 75,
                }}
              />
            ))}
      </div>
    </section>
  );
}

interface DepthCardProps {
  row: DepthRow;
  currentPrice: number;
  meta: { standardLabel: string; basis: string; defaultScore: number };
}

function DepthCard({ row, currentPrice, meta }: DepthCardProps) {
  const green = row.tone === "green";
  const text = green ? "text-terminal-green" : "text-terminal-red";
  const bar = green ? "bg-terminal-green" : "bg-terminal-red";
  const glow = green ? "shadow-[0_0_8px_#00E676]" : "shadow-[0_0_8px_#FF334B]";

  const zoneMid = row.zone ? (row.zone.min + row.zone.max) / 2 : 0;
  const distancePct =
    row.zone && currentPrice > 0 ? ((zoneMid - currentPrice) / currentPrice) * 100 : null;

  return (
    <article className="rounded border border-terminal-border bg-terminal-card/60 p-3 hover:border-terminal-gold/50 transition-colors space-y-1.5">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold tracking-wider ${text}`}>
          {meta.standardLabel}
        </span>
        <div className="flex items-center gap-2">
          {row.zone && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-terminal-black border border-terminal-border text-terminal-gold font-bold">
              SCORE: {meta.defaultScore}
            </span>
          )}
          <span className="text-[10px] text-terminal-subtext tabular-nums">
            {distancePct !== null ? `${distancePct >= 0 ? "+" : ""}${distancePct.toFixed(2)}%` : "—"}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-sm font-bold text-white tabular-nums">{formatZone(row.zone)}</span>
        <span className={`text-xs font-bold tabular-nums ${text}`}>
          {row.traders !== null ? formatInt(row.traders) : "••••••"}{" "}
          <span className="text-terminal-subtext font-normal">units (est.)</span>
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-terminal-black overflow-hidden">
        <div
          className={`h-full rounded-full ${bar} ${glow} transition-[width] duration-700 ease-out`}
          style={{ width: `${row.widthPct}%` }}
        />
      </div>

      <p className="text-[9px] text-terminal-subtext/80 flex items-center gap-1 pt-0.5">
        <Info className="w-3 h-3 text-terminal-subtext/60 shrink-0" />
        <span>{meta.basis}</span>
      </p>
    </article>
  );
}
