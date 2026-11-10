export interface TraderReview {
  id: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  tierBadge: string;
  rating: number;
  dateAgo: string;
  highlightMetric: string;
  category: "prop" | "scalper" | "orderflow";
  featureUsed: string;
  comment: string;
  verified: boolean;
}

export interface ProfitPost {
  id: string;
  traderName: string;
  location: string;
  badge: string;
  profitUsd: number;
  direction: "LONG" | "SHORT";
  timeframe: "1M" | "5M" | "15M" | "1H";
  setupUsed: string;
  pips: string;
  rating: number;
  comment: string;
  likes: number;
  verified: boolean;
  createdAt: string;
}

export interface CreateProfitPostInput {
  traderName: string;
  location?: string;
  profitUsd: number;
  direction?: "LONG" | "SHORT";
  timeframe?: "1M" | "5M" | "15M" | "1H";
  setupUsed?: string;
  pips?: string;
  rating?: number;
  comment?: string;
}

export const GENERATED_REVIEWS: TraderReview[] = [
  {
    id: "rev-1",
    name: "Marcus Vance",
    role: "Funded Prop Trader ($200K Account)",
    location: "London, UK",
    initials: "MV",
    tierBadge: "Quarterly Desk Pass",
    rating: 5,
    dateAgo: "2 days ago",
    highlightMetric: "+$18,450 Prop Payout",
    category: "prop",
    featureUsed: "Liquidity Concentration Pools",
    comment:
      "Before using XAUUSD Tracker, I kept getting wicked out on NY open stop-hunts before gold moved in my direction. The 15-candle Liquidity Concentration Pools show exact stop-loss clusters and the 0.618 Fibonacci expansion level. Caught a 1:3.4 R:R move after the sweep and secured my largest prop payout this quarter.",
    verified: true,
  },
  {
    id: "rev-2",
    name: "Tariq Al-Mansoor",
    role: "Private Spot Gold Trader",
    location: "Dubai, UAE",
    initials: "TA",
    tierBadge: "Pro Monthly Member",
    rating: 5,
    dateAgo: "4 days ago",
    highlightMetric: "+$24,600 Monthly P&L",
    category: "orderflow",
    featureUsed: "Buyer vs. Seller Volume Delta",
    comment:
      "Most retail indicators lag by 5 to 10 candles on gold. Watching the live Buyer vs. Seller aggression bar flip above 66% right as price taps the VWAP band gives me institutional timing. Clean interface, zero clutter, and accurate tick telemetry.",
    verified: true,
  },
  {
    id: "rev-3",
    name: "David Kimani",
    role: "Intraday XAU/USD Scalper",
    location: "Nairobi, Kenya",
    initials: "DK",
    tierBadge: "Pro Monthly Member",
    rating: 5,
    dateAgo: "1 week ago",
    highlightMetric: "+$6,420 First Month",
    category: "scalper",
    featureUsed: "Rule-Based Signal Engine",
    comment:
      "I started with the Pro Monthly pass to test the 1M and 5M signal engine. On my very first London session, the EMA(20/50) + RSI confluence setup triggered a buy that made me $1,280. It paid for itself within two hours and I haven't looked back.",
    verified: true,
  },
  {
    id: "rev-4",
    name: "Elena Rostova",
    role: "Quantitative Swing Trader",
    location: "Frankfurt, Germany",
    initials: "ER",
    tierBadge: "Quarterly Desk Pass",
    rating: 5,
    dateAgo: "1 week ago",
    highlightMetric: "+$14,200 Funded Account",
    category: "prop",
    featureUsed: "Position Sizing Calculator",
    comment:
      "Risk management on 100-oz gold contracts used to be my biggest weakness. Having the built-in Position Sizing Calculator linked directly with the setup's exact invalidation stop-loss level kept my drawdown under 1.2% while passing my evaluation.",
    verified: true,
  },
  {
    id: "rev-5",
    name: "Samuel Osei",
    role: "London–NY Session Trader",
    location: "Accra, Ghana",
    initials: "SO",
    tierBadge: "Pro Monthly Member",
    rating: 5,
    dateAgo: "2 weeks ago",
    highlightMetric: "+$8,950 in 14 Days",
    category: "scalper",
    featureUsed: "Multi-Session Regime Matrix",
    comment:
      "The Multi-Session Regime Matrix keeps me out of choppy Asian range traps and alerts me when London–NY overlap volatility expands. Waiting for an 80+ confluence score before executing has completely transformed my consistency.",
    verified: true,
  },
  {
    id: "rev-6",
    name: "Lucas Chen",
    role: "Algorithmic Liquidity Analyst",
    location: "Singapore",
    initials: "LC",
    tierBadge: "Pro Monthly Member",
    rating: 5,
    dateAgo: "3 weeks ago",
    highlightMetric: "+$11,920 in 10 Sessions",
    category: "orderflow",
    featureUsed: "Order Book Depth & VWAP",
    comment:
      "Having real-time bid/ask depth alongside institutional liquidation levels in one browser tab replaces three different paid tools I used to run. Worth every cent for serious XAU/USD traders.",
    verified: true,
  },
];

export const SEEDED_PROFIT_POSTS: ProfitPost[] = [
  {
    id: "win-seed-1",
    traderName: "Tariq Al-Mansoor",
    location: "Dubai, UAE",
    badge: "Verified Pro Trader",
    profitUsd: 18450,
    direction: "LONG",
    timeframe: "15M",
    setupUsed: "Institutional Order Flow + Liquidity Sweep",
    pips: "+145 pips • Verified Profit",
    rating: 5,
    comment: "Verified XAU/USD Profit Made with XAUUSD Tracker Pro.",
    likes: 94,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: "win-seed-2",
    traderName: "Marcus Vance",
    location: "London, UK",
    badge: "Verified Pro Trader",
    profitUsd: 12840,
    direction: "LONG",
    timeframe: "5M",
    setupUsed: "Liquidity Pool Sweep + Volume Delta",
    pips: "+112 pips • Verified Profit",
    rating: 5,
    comment: "Verified XAU/USD Profit Made with XAUUSD Tracker Pro.",
    likes: 78,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "win-seed-3",
    traderName: "David Kimani",
    location: "Nairobi, KE",
    badge: "Verified Pro Trader",
    profitUsd: 6420,
    direction: "LONG",
    timeframe: "5M",
    setupUsed: "Rule-Based Signal Engine",
    pips: "+88 pips • Verified Profit",
    rating: 5,
    comment: "Verified XAU/USD Profit Made with XAUUSD Tracker Pro.",
    likes: 65,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "win-seed-4",
    traderName: "Elena Rostova",
    location: "Frankfurt, DE",
    badge: "Verified Pro Trader",
    profitUsd: 9650,
    direction: "LONG",
    timeframe: "15M",
    setupUsed: "EMA(20/50) Trend + ATR Expansion",
    pips: "+96 pips • Verified Profit",
    rating: 5,
    comment: "Verified XAU/USD Profit Made with XAUUSD Tracker Pro.",
    likes: 53,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
  },
  {
    id: "win-seed-5",
    traderName: "Samuel Osei",
    location: "Accra, GH",
    badge: "Verified Pro Trader",
    profitUsd: 4890,
    direction: "LONG",
    timeframe: "5M",
    setupUsed: "London–NY Overlap Breakout",
    pips: "+74 pips • Verified Profit",
    rating: 5,
    comment: "Verified XAU/USD Profit Made with XAUUSD Tracker Pro.",
    likes: 49,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: "win-seed-6",
    traderName: "Lucas Chen",
    location: "Singapore, SG",
    badge: "Verified Pro Trader",
    profitUsd: 8280,
    direction: "LONG",
    timeframe: "5M",
    setupUsed: "Order Book Depth + Signal Engine",
    pips: "+82 pips • Verified Profit",
    rating: 5,
    comment: "Verified XAU/USD Profit Made with XAUUSD Tracker Pro.",
    likes: 61,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
  },
];

function sanitizeText(input: unknown, maxLen: number): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

export function validateProfitPostInput(
  raw: unknown
): { valid: true; data: Required<CreateProfitPostInput> } | { valid: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;
  const traderName = sanitizeText(body.traderName, 40);
  if (traderName.length < 2) {
    return {
      valid: false,
      error: "Please enter your name (at least 2 characters).",
    };
  }

  // Strictly reject negative numbers, zero, or loss strings
  if (typeof body.profitUsd === "string" && body.profitUsd.trim().startsWith("-")) {
    return {
      valid: false,
      error: "Only positive profits made can be posted on the Profit Wall. Losses are not permitted.",
    };
  }

  const profitRaw = Number(body.profitUsd);
  if (!Number.isFinite(profitRaw) || profitRaw <= 0) {
    return {
      valid: false,
      error: "Only positive profits made (> $0) are allowed. Losses cannot be posted.",
    };
  }
  if (profitRaw > 1000000) {
    return {
      valid: false,
      error: "Single profit entries are capped at $1,000,000.",
    };
  }
  const profitUsd = Math.round(profitRaw * 100) / 100;

  const location = sanitizeText(body.location, 40) || "Verified Trader";
  const direction = "LONG";
  const allowedTimeframes = ["1M", "5M", "15M", "1H"] as const;
  const timeframe = allowedTimeframes.includes(body.timeframe as any)
    ? (body.timeframe as "1M" | "5M" | "15M" | "1H")
    : "5M";

  const setupUsed =
    sanitizeText(body.setupUsed, 60) || "XAUUSD Tracker Signal & Order Flow";
  const pips = sanitizeText(body.pips, 35) || "Verified Profit Payout";

  const ratingNum = Number(body.rating);
  const rating =
    Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5
      ? Math.round(ratingNum)
      : 5;

  const rawComment = sanitizeText(body.comment, 400);
  const comment =
    rawComment.length > 0
      ? rawComment
      : "Verified XAU/USD Profit Made with XAUUSD Tracker Pro.";

  return {
    valid: true,
    data: {
      traderName,
      location,
      profitUsd,
      direction,
      timeframe,
      setupUsed,
      pips,
      rating,
      comment,
    },
  };
}
