export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface PlanConfig {
  id: string;
  name: string;
  tagline: string;
  priceUsd: number;
  billingInterval: "month" | "year";
  features: string[];
  ctaLabel: string;
}

export const INITIAL_PLAN: PlanConfig = {
  id: "institutional-tier",
  name: "Institutional Intelligence Clearance",
  tagline: "Full access to real-time stop-loss & take-profit concentration pools, quantitative liquidity zones, and rule-based setup telemetry.",
  priceUsd: 99.0,
  billingInterval: "month",
  features: [
    "Real-time XAU/USD Stop-Loss & Take-Profit Concentration Pools",
    "Fibonacci 0.618 Dynamic Liquidity Zones Chart Overlays",
    "Rule-Based Trade Setup Engine with R:R Validation & Explanations",
    "Algorithmic Trend (EMA), Momentum (RSI) & Volatility (ATR) Telemetry",
    "Interactive Risk / Reward & Position Sizing Calculator",
    "Full Order Flow Volume Depth & Retail Positioning Metrics",
    "Active Bullion Session Detection (London / New York / Asian)",
    "Priority WebSocket Streaming Engine with Automatic Failover",
  ],
  ctaLabel: "SUBSCRIBE NOW — $99/MO",
};
