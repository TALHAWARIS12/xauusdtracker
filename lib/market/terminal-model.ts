import { MarketDataState, ZoneRange } from "./types";

/* ----------------------------- Formatters ----------------------------- */

const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const int = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export const formatUsd = (v: number | null | undefined): string =>
  v !== null && v !== undefined && Number.isFinite(v) ? usd2.format(v) : "—";
export const formatInt = (v: number | null | undefined): string =>
  v !== null && v !== undefined && Number.isFinite(v) ? int.format(v) : "—";
export const formatPct = (ratio: number | null | undefined, digits = 1): string =>
  ratio !== null && ratio !== undefined && Number.isFinite(ratio)
    ? `${(ratio * 100).toFixed(digits)}%`
    : "—";
export const formatBillions = (b: number | null | undefined): string =>
  b !== null && b !== undefined && Number.isFinite(b) ? `$${b.toFixed(1)}B` : "—";
export const formatZone = (z: ZoneRange | null | undefined): string =>
  z
    ? `$${int.format(Math.round(z.min))} - ${int.format(Math.round(z.max))}`
    : "••••••••";

/* --------------------------- Derived model ---------------------------- */

export type DepthKind = "buyerSL" | "buyerTP" | "sellerSL" | "sellerTP";

export interface DepthRow {
  key: DepthKind;
  label: string;
  zone: ZoneRange | null;
  traders: number | null;
  widthPct: number; // 0-100, relative to largest cluster
  tone: "green" | "red";
}

export interface SideSummary {
  traders: number;
  notionalBillion: number;
  share: number; // 0-1 share of total headcount
}

export interface PositionRow {
  side: "BUYERS" | "SELLERS";
  traders: number | null;
  entry: ZoneRange | null;
  stopLoss: ZoneRange | null;
  takeProfit: ZoneRange | null;
  notionalBillion: number | null;
}

export interface TerminalModel {
  ready: boolean;
  change24h: number | null;
  buyers: SideSummary;
  sellers: SideSummary;
  depth: DepthRow[];
  positions: PositionRow[];
  /** Mid-points used for chart price lines (null if paywalled). */
  lines: { buyerTP: number; sellerSL: number; buyerSL: number; sellerTP: number } | null;
  orderBook?: import("./types").LiveOrderBook | null;
  orderFlow?: import("./types").LiveOrderFlow | null;
  wsStatus: import("./types").WebSocketStatus;
}

const BUYER_SL_SHARE = 150_000 / 180_000;
const BUYER_TP_SHARE = 120_000 / 180_000;
const SELLER_SL_SHARE = 55_000 / 70_000;
const SELLER_TP_SHARE = 48_000 / 70_000;
const TP_BAND = 0.005;

const band = (center: number, pct: number): ZoneRange => ({
  min: center * (1 - pct),
  max: center * (1 + pct),
});
const mid = (z: ZoneRange): number => (z.min + z.max) / 2;

export function deriveTerminalModel(
  state: MarketDataState,
  isSubscribed = true
): TerminalModel {
  const { currentPrice, swingLevels, liquidityZones, volumeDistribution, stats24h } = state;

  const change24h =
    stats24h && stats24h.openPrice > 0 && currentPrice > 0
      ? (currentPrice - stats24h.openPrice) / stats24h.openPrice
      : null;

  const buyerTraders = volumeDistribution?.buyerHeadcount ?? 0;
  const sellerTraders = volumeDistribution?.sellerHeadcount ?? 0;
  const totalTraders = buyerTraders + sellerTraders;

  const buyers: SideSummary = {
    traders: buyerTraders,
    notionalBillion: volumeDistribution?.buySideNotionalBillion ?? 0,
    share: totalTraders > 0 ? buyerTraders / totalTraders : 0.5,
  };
  const sellers: SideSummary = {
    traders: sellerTraders,
    notionalBillion: volumeDistribution?.sellSideNotionalBillion ?? 0,
    share: totalTraders > 0 ? sellerTraders / totalTraders : 0.5,
  };

  const wsStatus = state.wsStatus || "Live Connected";
  const orderBook = state.orderBook || null;
  const orderFlow = state.orderFlow || null;

  if (!liquidityZones || !swingLevels || currentPrice <= 0) {
    return { ready: false, change24h, buyers, sellers, depth: [], positions: [], lines: null, orderBook, orderFlow, wsStatus };
  }

  // PAYWALL SANITIZATION: Non-subscribers receive null for proprietary SL/TP clusters
  if (!isSubscribed) {
    return {
      ready: true,
      change24h,
      buyers,
      sellers,
      depth: [
        { key: "buyerSL", label: "BUYERS STOP LOSS", zone: null, traders: null, widthPct: 0, tone: "red" },
        { key: "buyerTP", label: "BUYERS TAKE PROFIT", zone: null, traders: null, widthPct: 0, tone: "green" },
        { key: "sellerSL", label: "SELLERS STOP LOSS", zone: null, traders: null, widthPct: 0, tone: "green" },
        { key: "sellerTP", label: "SELLERS TAKE PROFIT", zone: null, traders: null, widthPct: 0, tone: "red" },
      ],
      positions: [
        { side: "BUYERS", traders: null, entry: null, stopLoss: null, takeProfit: null, notionalBillion: null },
        { side: "SELLERS", traders: null, entry: null, stopLoss: null, takeProfit: null, notionalBillion: null },
      ],
      lines: null, // Chart price lines disabled for non-subscribers
      orderBook,
      orderFlow,
      wsStatus,
    };
  }

  const buyerTPZone = band(liquidityZones.buyerTPZone, TP_BAND);
  const sellerTPZone = band(liquidityZones.sellerTPZone, TP_BAND);

  const rawDepth: Omit<DepthRow, "widthPct">[] = [
    {
      key: "buyerSL",
      label: "BUYERS STOP LOSS",
      zone: liquidityZones.buyerSLZone,
      traders: Math.round(buyerTraders * BUYER_SL_SHARE),
      tone: "red",
    },
    {
      key: "buyerTP",
      label: "BUYERS TAKE PROFIT",
      zone: buyerTPZone,
      traders: Math.round(buyerTraders * BUYER_TP_SHARE),
      tone: "green",
    },
    {
      key: "sellerSL",
      label: "SELLERS STOP LOSS",
      zone: liquidityZones.sellerSLZone,
      traders: Math.round(sellerTraders * SELLER_SL_SHARE),
      tone: "green",
    },
    {
      key: "sellerTP",
      label: "SELLERS TAKE PROFIT",
      zone: sellerTPZone,
      traders: Math.round(sellerTraders * SELLER_TP_SHARE),
      tone: "red",
    },
  ];
  const maxTraders = Math.max(1, ...rawDepth.map((d) => d.traders || 0));
  const depth: DepthRow[] = rawDepth.map((d) => ({
    ...d,
    widthPct: Math.max(2, ((d.traders || 0) / maxTraders) * 100),
  }));

  const positions: PositionRow[] = [
    {
      side: "BUYERS",
      traders: buyerTraders,
      entry: {
        min: Math.min(swingLevels.swingLow, currentPrice),
        max: Math.max(swingLevels.swingLow, currentPrice),
      },
      stopLoss: liquidityZones.buyerSLZone,
      takeProfit: buyerTPZone,
      notionalBillion: buyers.notionalBillion,
    },
    {
      side: "SELLERS",
      traders: sellerTraders,
      entry: {
        min: Math.min(currentPrice, swingLevels.swingHigh),
        max: Math.max(currentPrice, swingLevels.swingHigh),
      },
      stopLoss: liquidityZones.sellerSLZone,
      takeProfit: sellerTPZone,
      notionalBillion: sellers.notionalBillion,
    },
  ];

  return {
    ready: true,
    change24h,
    buyers,
    sellers,
    depth,
    positions,
    lines: {
      buyerTP: liquidityZones.buyerTPZone,
      sellerSL: mid(liquidityZones.sellerSLZone),
      buyerSL: mid(liquidityZones.buyerSLZone),
      sellerTP: liquidityZones.sellerTPZone,
    },
    orderBook,
    orderFlow,
    wsStatus,
  };
}
