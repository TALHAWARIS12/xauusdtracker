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
    id: "monthly",
    name: "Monthly Pro",
    badge: "Most Popular",
    priceUsd: 48,
    interval: "month",
    intervalLabel: "/ month",
    billingText: "Billed monthly · Cancel anytime",
    description: "Our core membership for serious traders who require institutional-grade gold data daily.",
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
    badge: "Best Value - Save 67%",
    priceUsd: 188,
    interval: "year",
    intervalLabel: "/ year",
    billingText: "Billed annually ($15.67/mo equivalent)",
    description: "Maximum savings for committed traders. Lock in institutional gold analytics for a full year.",
    features: [
      "Everything in Monthly Pro",
      "67% savings compared to standard monthly pricing",
      "Full 365 days of continuous Pro access",
      "VIP feature access & future AI model updates",
      "Direct analyst support channel",
    ],
  },
];

export const DEFAULT_PLAN_ID = "monthly";

export function getPlanById(id: string): PlanTier {
  return PRICING_PLANS.find((p) => p.id === id) || PRICING_PLANS[0];
}

/** Legacy backwards-compatibility alias for existing references */
export const INITIAL_PLAN = {
  id: "monthly",
  name: "Monthly Pro",
  tagline: "Full access to real-time stop-loss & take-profit concentration pools, quantitative liquidity zones, and rule-based setup telemetry.",
  priceUsd: 48.0,
  billingInterval: "month" as const,
  features: PRICING_PLANS[0].features,
  ctaLabel: "SUBSCRIBE NOW — $48/MO",
};
