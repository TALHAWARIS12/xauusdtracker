"use client";

import { TrendingDown, TrendingUp, Users, Clock } from "lucide-react";
import type { ConnectionMode } from "@/lib/market/types";
import {
  formatBillions,
  formatInt,
  formatPct,
  formatUsd,
  type SideSummary,
} from "@/lib/market/terminal-model";

interface MetricsHeaderProps {
  price: number;
  previousPrice: number;
  change24h: number | null;
  buyers: SideSummary;
  sellers: SideSummary;
  connectionMode: ConnectionMode;
  lastUpdated?: number;
}

const FEED_LABEL: Record<ConnectionMode, { text: string; cls: string }> = {
  websocket: { text: "WS LIVE", cls: "text-terminal-green border-terminal-green/40 bg-terminal-green/10" },
  polling: { text: "REST 2s", cls: "text-terminal-gold border-terminal-gold/40 bg-terminal-gold/10" },
  connecting: { text: "SYNCING", cls: "text-terminal-subtext border-terminal-border bg-terminal-card" },
  error: { text: "OFFLINE", cls: "text-terminal-red border-terminal-red/40 bg-terminal-red/10" },
};

export function MetricsHeader({
  price,
  previousPrice,
  change24h,
  buyers,
  sellers,
  connectionMode,
  lastUpdated,
}: MetricsHeaderProps) {
  const tickUp = price >= previousPrice;
  const changeUp = (change24h ?? 0) >= 0;
  const feed = FEED_LABEL[connectionMode];
  const buyerPct = Math.min(100, Math.max(0, buyers.share * 100));

  const timeString = lastUpdated
    ? new Date(lastUpdated).toISOString().slice(11, 19) + " UTC"
    : "STREAMING UTC";

  return (
    <section aria-label="Market metrics" className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1 — Asset */}
        <div className="bg-terminal-surface border border-terminal-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-terminal-subtext">
              <span className="tracking-widest">ASSET // SPOT XAU/USD</span>
              <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${feed.cls}`}>
                {feed.text}
              </span>
            </div>
            <div className="mt-1 text-sm font-bold text-terminal-gold tracking-wider">
              XAU/USD · PHYSICAL GOLD SPOT
            </div>
            <div className="mt-2 flex items-end gap-3">
              <span
                className={`text-3xl font-extrabold tabular-nums transition-colors duration-300 ${
                  price > 0 ? (tickUp ? "text-terminal-green" : "text-terminal-red") : "text-terminal-subtext"
                }`}
              >
                {price > 0 ? formatUsd(price) : "—"}
              </span>
              {change24h !== null && (
                <span
                  className={`mb-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border tabular-nums ${
                    changeUp
                      ? "text-terminal-green bg-terminal-green/10 border-terminal-green/40"
                      : "text-terminal-red bg-terminal-red/10 border-terminal-red/40"
                  }`}
                >
                  {changeUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {changeUp ? "+" : ""}
                  {(change24h * 100).toFixed(2)}% 24H
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-terminal-border/60 flex items-center justify-between text-[10px] text-terminal-subtext">
            <span>Feed: PAXG/USDT (1:1 Troy Oz Spot)</span>
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="w-3 h-3 text-terminal-gold" />
              {timeString}
            </span>
          </div>
        </div>

        {/* Card 2 — Buyers Pressure */}
        <SideCard
          title="BUY-SIDE PRESSURE"
          tone="green"
          traders={buyers.traders}
          notional={buyers.notionalBillion}
          notionalLabel="Modelled Buy-Side Notional"
          share={buyers.share}
        />

        {/* Card 3 — Sellers Pressure */}
        <SideCard
          title="SELL-SIDE PRESSURE"
          tone="red"
          traders={sellers.traders}
          notional={sellers.notionalBillion}
          notionalLabel="Modelled Sell-Side Notional"
          share={sellers.share}
        />
      </div>

      {/* Split bar */}
      <div className="bg-terminal-surface border border-terminal-border rounded-lg px-4 py-3">
        <div className="flex justify-between text-[11px] font-bold tabular-nums mb-1.5">
          <span className="text-terminal-green">BUY-SIDE DELTA {formatPct(buyers.share)}</span>
          <span className="text-terminal-subtext tracking-widest hidden sm:inline">
            ESTIMATED VOLUME DISTRIBUTION // 30-BAR ROLLING WINDOW
          </span>
          <span className="text-terminal-red">{formatPct(sellers.share)} SELL-SIDE DELTA</span>
        </div>
        <div
          className="h-2.5 w-full rounded-full overflow-hidden flex bg-terminal-black border border-terminal-border"
          role="progressbar"
          aria-valuenow={Math.round(buyerPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Buyer share"
        >
          <div
            className="h-full bg-terminal-green shadow-[0_0_10px_#00E676] transition-[width] duration-700 ease-out"
            style={{ width: `${buyerPct}%` }}
          />
          <div className="h-full flex-1 bg-terminal-red" />
        </div>
      </div>
    </section>
  );
}

interface SideCardProps {
  title: string;
  tone: "green" | "red";
  traders: number;
  notional: number;
  notionalLabel: string;
  share: number;
}

function SideCard({ title, tone, traders, notional, notionalLabel, share }: SideCardProps) {
  const text = tone === "green" ? "text-terminal-green" : "text-terminal-red";
  const border = tone === "green" ? "border-terminal-green/30" : "border-terminal-red/30";
  const badge =
    tone === "green"
      ? "bg-terminal-green/10 border-terminal-green/40 text-terminal-green"
      : "bg-terminal-red/10 border-terminal-red/40 text-terminal-red";

  return (
    <div className={`bg-terminal-surface border ${border} rounded-lg p-4 flex flex-col justify-between`}>
      <div>
        <div className="flex items-center justify-between text-[11px]">
          <span className={`flex items-center gap-1.5 font-bold tracking-widest ${text}`}>
            <Users className="w-3.5 h-3.5" />
            {title}
          </span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold tabular-nums ${badge}`}>
            {formatPct(share)}
          </span>
        </div>
        <div className={`mt-2 text-3xl font-extrabold tabular-nums ${text}`}>
          {formatInt(traders)}
          <span className="ml-2 text-xs font-semibold text-terminal-subtext">units (proxy)</span>
        </div>
      </div>
      <div className="mt-3 pt-2 border-t border-terminal-border/60 flex items-center justify-between text-[11px]">
        <span className="text-terminal-subtext">{notionalLabel}</span>
        <span className="font-bold text-white tabular-nums">{formatBillions(notional)}</span>
      </div>
    </div>
  );
}
