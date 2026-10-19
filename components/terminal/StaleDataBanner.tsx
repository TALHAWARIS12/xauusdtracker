"use client";

import { AlertTriangle, WifiOff, RefreshCw } from "lucide-react";
import type { ConnectionMode } from "@/lib/market/types";

interface StaleDataBannerProps {
  connectionMode: ConnectionMode;
  isFallback: boolean;
  lastUpdated: number;
}

export function StaleDataBanner({ connectionMode, isFallback, lastUpdated }: StaleDataBannerProps) {
  const isStale = connectionMode === "error" || (connectionMode === "polling" && isFallback);

  if (!isStale) {
    return null;
  }

  const secondsAgo = Math.floor((Date.now() - lastUpdated) / 1000);

  return (
    <div
      role="alert"
      className="bg-terminal-gold/15 border border-terminal-gold/50 rounded-lg p-3 text-xs font-mono text-terminal-gold flex items-center justify-between gap-3 shadow-lg"
    >
      <div className="flex items-center gap-2.5">
        {connectionMode === "error" ? (
          <WifiOff className="w-4 h-4 text-terminal-red shrink-0" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-terminal-gold shrink-0 animate-pulse" />
        )}
        <div>
          <span className="font-extrabold tracking-wide uppercase">
            {connectionMode === "error"
              ? "FEED DISCONNECTED // DATA STREAM OFFLINE"
              : "WEBSOCKET STREAM INTERRUPTED // REST POLLING ACTIVE"}
          </span>
          <p className="text-[11px] text-gray-300 mt-0.5">
            {connectionMode === "error"
              ? "Unable to reach spot bullion exchange stream. Values displayed may be stale."
              : "Operating on 2-second REST polling fallback. Numerical indicators reflect recent historical candles."}
          </p>
        </div>
      </div>

      <div className="text-[10px] text-terminal-subtext shrink-0 tabular-nums hidden sm:block">
        Updated {secondsAgo}s ago
      </div>
    </div>
  );
}
