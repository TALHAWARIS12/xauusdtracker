/**
 * Consumer-facing formatting helpers for market data.
 * Pure functions — safe for both server and client and covered by unit tests.
 */

const pad = (n: number, width = 2): string => String(n).padStart(width, "0");

/** Formats a date as `YYYY-MM-DD HH:mm:ss UTC`. */
export function formatUtcTimestamp(date: Date): string {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())} UTC`
  );
}

/** Formats a USD amount compactly, e.g. 1_420_000_000 -> "$1.42B", 131_700_000 -> "$131.7M". */
export function formatCompactUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Rough estimate used for the free tier: keeps only two significant digits,
 * e.g. 131_742_118 -> "~$130M".
 */
export function formatRoughUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) return "—";
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)) - 1);
  const rounded = Math.round(value / magnitude) * magnitude;
  return `~${formatCompactUsd(rounded).replace(/\.0(?=[KMBT])/, "")}`;
}

/** Rounds a 0-1 share to the nearest `step` (default 5%) for aggregated free-tier figures. */
export function roundShare(share: number, step = 0.05): number {
  if (!Number.isFinite(share)) return 0.5;
  const clamped = Math.min(1, Math.max(0, share));
  return Math.round(clamped / step) * step;
}

/** Converts a 0-1 share into an integer percentage that, paired with its complement, sums to 100. */
export function toPercentPair(share: number): { left: number; right: number } {
  const left = Math.round(Math.min(1, Math.max(0, Number.isFinite(share) ? share : 0.5)) * 100);
  return { left, right: 100 - left };
}

export function formatSignedPct(ratio: number | null | undefined, digits = 2): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return "—";
  const pct = ratio * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(digits)}%`;
}

export function formatSignedUsd(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value).toFixed(2);
  return `${value >= 0 ? "+" : "-"}$${abs}`;
}
