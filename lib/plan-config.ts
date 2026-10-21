export interface PlanTier {
  id: "daily" | "weekly" | "monthly" | "yearly";
  name: string;
  badge?: string;
  priceUsd: number;
  interval: "day" | "week" | "month" | "year";
  intervalLabel: string;
  billingText: string;
  description: string;
  isPopular?: boolean;
  features: string[];
}

export const PRICING_PLANS: PlanTier[] = [
  {
    id: "daily",
    name: "Daily Pass",
    priceUsd: 3,
    interval: "day",
    intervalLabel: "/ day",
    billingText: "Billed daily · Instant 24h access",
    description: "Ideal for day traders seeking real-time gold order flow for today's session.",
    features: [
      "24-hour full Pro access",
      "Real-time XAU/USD tick-by-tick charts",
      "Full order book depth & liquidation zones",
      "Algorithmic trade setup signals",
      "Risk & position sizing calculator",
    ],
  },
  {
    id: "weekly",
    name: "Weekly Pass",
    priceUsd: 10,
    interval: "week",
    intervalLabel: "/ week",
    billingText: "Billed weekly · Cancel anytime",
    description: "Great for active swing traders tracking weekly gold liquidity cycles.",
    features: [
      "7-day uninterrupted Pro access",
      "London & New York session overlap alerts",
      "Real-time order flow depth clusters",
      "Fibonacci 0.618 expansion targets",
      "Automated trade setup evaluation",
    ],
  },
  {
    id: "monthly",
    name: "Monthly Pro",
    badge: "Most Popular",
    priceUsd: 28,
    interval: "month",
    intervalLabel: "/ month",
    billingText: "Billed monthly · Cancel anytime",
    description: "Our core membership for serious traders who require institutional-grade data daily.",
    isPopular: true,
    features: [
      "Full zero-delay market telemetry",
      "Real-time buyer & seller liquidation pools",
      "Multi-timeframe candlestick analysis (1M/5M/15M)",
      "High-probability trade setup alerts",
      "Complete market volume analytics & delta",
      "Priority customer support",
    ],
  },
  {
    id: "yearly",
    name: "Yearly Pro",
    badge: "Best Value - Save 74%",
    priceUsd: 88,
    interval: "year",
    intervalLabel: "/ year",
    billingText: "Billed annually ($7.33/mo equivalent)",
    description: "Maximum savings for committed traders. Lock in institutional gold analytics for a full year.",
    features: [
      "Everything in Monthly Pro",
      "74% savings compared to standard pricing",
      "Full 365 days of continuous Pro access",
      "VIP feature access & future AI model updates",
      "Direct analyst support channel",
    ],
  },
];

export const DEFAULT_PLAN_ID = "monthly";

export function getPlanById(id: string): PlanTier {
  return PRICING_PLANS.find((p) => p.id === id) || PRICING_PLANS[2];
}

/** Legacy backwards-compatibility alias for existing references */
export const INITIAL_PLAN = {
  id: "monthly",
  name: "Monthly Pro",
  tagline: "Full access to real-time stop-loss & take-profit concentration pools, quantitative liquidity zones, and rule-based setup telemetry.",
  priceUsd: 28.0,
  billingInterval: "month" as const,
  features: PRICING_PLANS[2].features,
  ctaLabel: "SUBSCRIBE NOW — $28/MO",
};
