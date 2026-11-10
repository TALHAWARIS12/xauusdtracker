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
  direction: "LONG" | "SHORT";
  timeframe: "1M" | "5M" | "15M" | "1H";
  setupUsed: string;
  pips?: string;
  rating?: number;
  comment: string;
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
    highlightMetric: "+$6,420 Prop Payout",
    category: "prop",
    featureUsed: "Liquidity Concentration Pools",
    comment:
      "Before using XAUUSD Tracker, I kept getting wicked out on NY open stop-hunts before gold moved in my direction. The 15-candle Liquidity Concentration Pools show exact stop-loss clusters and the 0.618 Fibonacci expansion level. Caught a 1:3.4 R:R long after the sweep and secured my largest prop payout this quarter.",
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
    highlightMetric: "+$11,800 Monthly P&L",
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
    highlightMetric: "+$1,450 First Week",
    category: "scalper",
    featureUsed: "Rule-Based Signal Engine",
    comment:
      "I started with the Pro Monthly pass to test the 1M and 5M signal engine. On my very first London session, the EMA(20/50) + RSI confluence setup triggered a buy that made me $280. It paid for itself within two hours and I haven't looked back.",
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
    highlightMetric: "Passed 2-Step Evaluation",
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
    tierBadge: "Weekly Trader Pass",
    rating: 5,
    dateAgo: "2 weeks ago",
    highlightMetric: "82% Win Rate Last 14 Days",
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
    highlightMetric: "+$3,920 in 10 Sessions",
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
    traderName: "Marcus V.",
    location: "London, UK",
    badge: "Verified Pro Trader",
    profitUsd: 2840,
    direction: "LONG",
    timeframe: "5M",
    setupUsed: "Liquidity Pool Sweep + Volume Delta",
    pips: "+112 pips • 1:3.4 R:R",
    rating: 5,
    comment:
      "Caught the London liquidity sweep right at the lower stop-loss cluster when Buyer Volume Delta surged to 68%. Rode the impulse wave straight to the 0.618 Fibonacci expansion target.",
    likes: 47,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "win-seed-2",
    traderName: "David K.",
    location: "Nairobi, KE",
    badge: "Verified Pro Trader",
    profitUsd: 645,
    direction: "LONG",
    timeframe: "1M",
    setupUsed: "Rule-Based Signal Engine (Score 88)",
    pips: "+54 pips • 1:2.5 R:R",
    rating: 5,
    comment:
      "Tested the 1M signal engine on day one, locked in +54 pips during the New York open breakout and banked $645. Trust the invalidation levels!",
    likes: 39,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
  },
  {
    id: "win-seed-3",
    traderName: "Tariq A.",
    location: "Dubai, UAE",
    badge: "Quarterly Desk Member",
    profitUsd: 5120,
    direction: "SHORT",
    timeframe: "15M",
    setupUsed: "Upper Stop-Hunt Rejection",
    pips: "+145 pips • 1:4.1 R:R",
    rating: 5,
    comment:
      "The upper liquidation pool flagged heavy institutional ask absorption above session highs. Entered short on the 15M signal confirmation and held down to the session VWAP magnet.",
    likes: 64,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "win-seed-4",
    traderName: "Elena R.",
    location: "Frankfurt, DE",
    badge: "Verified Pro Trader",
    profitUsd: 1950,
    direction: "LONG",
    timeframe: "15M",
    setupUsed: "EMA(20/50) Trend + ATR Expansion",
    pips: "+92 pips • 1:3.0 R:R",
    rating: 5,
    comment:
      "Passed Phase 2 of my prop firm challenge with this single trade! Used the built-in lot calculator to risk exactly 0.75% and banked +2.25% on the NY continuation.",
    likes: 31,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 29).toISOString(),
  },
  {
    id: "win-seed-5",
    traderName: "Samuel O.",
    location: "Accra, GH",
    badge: "Weekly Pass Trader",
    profitUsd: 410,
    direction: "LONG",
    timeframe: "5M",
    setupUsed: "London–NY Overlap Breakout",
    pips: "+48 pips • 1:2.2 R:R",
    rating: 5,
    comment:
      "Used to overtrade chop. Waiting for the London–NY Overlap regime indicator to turn green + 62% buyer flow made this the easiest $410 of my week.",
    likes: 28,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
  },
  {
    id: "win-seed-6",
    traderName: "Lucas C.",
    location: "Singapore, SG",
    badge: "Verified Pro Trader",
    profitUsd: 1280,
    direction: "SHORT",
    timeframe: "5M",
    setupUsed: "Order Book Ask Wall + Bearish Setup",
    pips: "+76 pips • 1:2.8 R:R",
    rating: 5,
    comment:
      "Spotted a massive ask wall on the order book depth right at resistance while RSI rolled over. Clean entry, zero drawdown, hit TP2 in 35 minutes.",
    likes: 35,
    verified: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
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
): { valid: true; data: CreateProfitPostInput } | { valid: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { valid: false, error: "Invalid request payload." };
  }

  const body = raw as Record<string, unknown>;
  const traderName = sanitizeText(body.traderName, 40);
  if (traderName.length < 2) {
    return { valid: false, error: "Please enter your name or trader alias (at least 2 characters)." };
  }

  const location = sanitizeText(body.location, 40) || "Global Trader";

  const profitRaw = Number(body.profitUsd);
  if (!Number.isFinite(profitRaw) || profitRaw <= 0) {
    return { valid: false, error: "Please enter a valid positive profit amount in USD." };
  }
  if (profitRaw > 500000) {
    return { valid: false, error: "Single trade profit entries are capped at $500,000 for verification." };
  }
  const profitUsd = Math.round(profitRaw * 100) / 100;

  const direction = body.direction === "SHORT" ? "SHORT" : "LONG";

  const allowedTimeframes = ["1M", "5M", "15M", "1H"] as const;
  const timeframe = allowedTimeframes.includes(body.timeframe as any)
    ? (body.timeframe as "1M" | "5M" | "15M" | "1H")
    : "5M";

  const setupUsed =
    sanitizeText(body.setupUsed, 60) || "Order Flow & Signal Engine";

  const pips = sanitizeText(body.pips, 35) || "Verified Target Hit";

  const ratingNum = Number(body.rating);
  const rating =
    Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5
      ? Math.round(ratingNum)
      : 5;

  const comment = sanitizeText(body.comment, 400);
  if (comment.length < 10) {
    return {
      valid: false,
      error: "Please share at least a short note (10+ characters) on how you caught the trade to motivate others.",
    };
  }

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

