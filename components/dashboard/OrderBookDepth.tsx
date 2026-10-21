"use client";

import { Layers, Info } from "lucide-react";
import { formatInt, formatZone, type DepthRow } from "@/lib/market/terminal-model";
import { PaywallGateOverlay } from "@/components/dashboard/PaywallGateOverlay";

interface OrderBookDepthProps {
  rows: DepthRow[];
  currentPrice: number;
  isSubscribed: boolean;
}

const ZONE_DESCRIPTIONS: Record<string, { standardLabel: string; basis: string; defaultScore: number }> = {
  buyerSL: {
    standardLabel: "Buyer Stop-Loss Cluster",
    basis: "Estimated retail stop-loss cluster resting 0.2%-0.5% below recent swing low.",
    defaultScore: 84,
  },
  buyerTP: {
    standardLabel: "Buyer Take-Profit Target",
    basis: "Fibonacci 0.618 golden impulse extension target above swing high.",
    defaultScore: 91,
  },
  sellerSL: {
    standardLabel: "Seller Stop-Loss Pool",
    basis: "Estimated buy-stop liquidity pool resting 0.2%-0.5% above recent swing high.",
    defaultScore: 82,
  },
  sellerTP: {
    standardLabel: "Seller Take-Profit Target",
    basis: "Fibonacci 0.618 golden impulse extension target below swing low.",
    defaultScore: 88,
  },
};

export function OrderBookDepth({ rows, currentPrice, isSubscribed }: OrderBookDepthProps) {
  const cp = currentPrice > 1000 ? currentPrice : 4140.0;

  // Dynamic preview data underneath paywall if free or loading
  const displayRows: DepthRow[] =
    !isSubscribed || rows.length === 0
      ? [
          {
            key: "buyerSL",
            label: "Buyer Stop-Loss Cluster",
            zone: { min: Math.round(cp * 0.995), max: Math.round(cp * 0.998) },
            traders: 125000,
            widthPct: 85,
            tone: "red",
          },
          {
            key: "buyerTP",
            label: "Buyer Take-Profit Target",
            zone: { min: Math.round(cp * 1.008), max: Math.round(cp * 1.015) },
            traders: 98000,
            widthPct: 70,
            tone: "green",
          },
          {
            key: "sellerSL",
            label: "Seller Stop-Loss Pool",
            zone: { min: Math.round(cp * 1.002), max: Math.round(cp * 1.005) },
            traders: 54000,
            widthPct: 45,
            tone: "green",
          },
          {
            key: "sellerTP",
            label: "Seller Take-Profit Target",
            zone: { min: Math.round(cp * 0.985), max: Math.round(cp * 0.992) },
            traders: 46000,
            widthPct: 38,
            tone: "red",
          },
        ]
      : rows;

  return (
    <section
      aria-label="Order book depth"
      className="card relative flex h-full flex-col overflow-hidden"
      id="order-book-depth-section"
    >
      <header className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-400/10 text-gold-300">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Order Book Depth</h2>
            <p className="text-[11px] text-slate-400">Institutional liquidity zones</p>
          </div>
        </div>
        <span className="badge border border-white/10 bg-white/[0.04] text-[11px] text-slate-300">
          Live Clusters
        </span>
      </header>

      {/* Main Depth Content */}
      <div className={`flex-1 p-4 space-y-3 ${!isSubscribed ? "filter blur-[5px] select-none pointer-events-none" : ""}`}>
        {displayRows.map((row) => (
          <DepthCard
            key={row.key}
            row={row}
            currentPrice={currentPrice}
            meta={
              ZONE_DESCRIPTIONS[row.key] || {
                standardLabel: row.label,
                basis: "Algorithmic price structure model.",
                defaultScore: 80,
              }
            }
          />
        ))}
      </div>

      {/* Freemium Paywall Overlay */}
      {!isSubscribed && (
        <PaywallGateOverlay
          heading="Unlock Real-Time Institutional Order Flow"
          subtext="Subscribe to access zero-delay tick data, depth charts, and automated broker signals."
          buttonText="Choose Your Plan"
          pricingHref="/pricing"
        />
      )}
    </section>
  );
}

interface DepthCardProps {
  row: DepthRow;
  currentPrice: number;
  meta: { standardLabel: string; basis: string; defaultScore: number };
}

function DepthCard({ row, currentPrice, meta }: DepthCardProps) {
  const isGreen = row.tone === "green";
  const textColor = isGreen ? "text-bull-300" : "text-bear-300";
  const barGradient = isGreen
    ? "from-bull-500 to-bull-300"
    : "from-bear-500 to-bear-300";

  const zoneMid = row.zone ? (row.zone.min + row.zone.max) / 2 : 0;
  const distancePct =
    row.zone && currentPrice > 0 ? ((zoneMid - currentPrice) / currentPrice) * 100 : null;

  return (
    <article className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 transition-colors hover:border-white/10 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold ${textColor}`}>{meta.standardLabel}</span>
        <div className="flex items-center gap-2">
          {row.zone && (
            <span className="rounded bg-gold-400/10 px-1.5 py-0.5 text-[10px] font-bold text-gold-300 border border-gold-400/20">
              Score: {meta.defaultScore}
            </span>
          )}
          <span className="text-[11px] text-slate-400 tabular">
            {distancePct !== null ? `${distancePct >= 0 ? "+" : ""}${distancePct.toFixed(2)}%` : "—"}
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <span className="text-base font-bold text-white tabular">
          {row.zone ? formatZone(row.zone) : "••••••••"}
        </span>
        <span className="text-xs text-slate-300 tabular">
          <strong className={`font-bold ${textColor}`}>
            {row.traders !== null ? formatInt(row.traders) : "••••••"}
          </strong>{" "}
          <span className="text-slate-400">units</span>
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-[width] duration-700 ease-out`}
          style={{ width: `${Math.max(8, row.widthPct)}%` }}
        />
      </div>

      <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-0.5">
        <Info className="h-3 w-3 text-slate-500 shrink-0" />
        <span className="truncate">{meta.basis}</span>
      </p>
    </article>
  );
}
