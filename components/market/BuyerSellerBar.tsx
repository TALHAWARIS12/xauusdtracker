import { toPercentPair } from "@/lib/market/format";

interface BuyerSellerBarProps {
  /** Buyer share between 0 and 1. */
  buyerShare: number;
  size?: "sm" | "md";
  id?: string;
}

export function BuyerSellerBar({ buyerShare, size = "md", id }: BuyerSellerBarProps) {
  const { left: buyers, right: sellers } = toPercentPair(buyerShare);
  const height = size === "sm" ? "h-2" : "h-3";

  return (
    <div className="space-y-2" id={id}>
      <div className="flex items-center justify-between text-sm font-semibold tabular">
        <span className="text-bull-300">
          {buyers}% <span className="font-medium text-slate-400">Buyers</span>
        </span>
        <span className="text-bear-300">
          <span className="font-medium text-slate-400">Sellers</span> {sellers}%
        </span>
      </div>
      <div
        className={`flex w-full overflow-hidden rounded-full bg-white/5 ${height}`}
        role="meter"
        aria-label="Buyer versus seller ratio"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={buyers}
      >
        <div
          className="h-full rounded-l-full bg-gradient-to-r from-bull-500 to-bull-300 transition-[width] duration-700 ease-out"
          style={{ width: `${buyers}%` }}
        />
        <div className="w-[3px] shrink-0 bg-ink-950" />
        <div
          className="h-full flex-1 rounded-r-full bg-gradient-to-r from-bear-300 to-bear-500 transition-[width] duration-700 ease-out"
        />
      </div>
    </div>
  );
}
