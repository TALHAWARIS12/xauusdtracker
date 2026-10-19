import { describe, it, expect } from "vitest";
import { calculateRiskReward } from "@/lib/market/calculator";

describe("Risk / Reward & Position Sizing Calculator", () => {
  it("correctly calculates valid LONG trade risk/reward ratio", () => {
    const res = calculateRiskReward({
      entryPrice: 2715.0,
      stopLossPrice: 2705.0, // $10 risk
      takeProfitPrice: 2740.0, // $25 reward
    });

    expect(res.isValid).toBe(true);
    expect(res.direction).toBe("LONG");
    expect(res.stopDistanceUsd).toBe(10.0);
    expect(res.targetDistanceUsd).toBe(25.0);
    expect(res.rewardToRiskRatio).toBe(2.5);
  });

  it("correctly calculates valid SHORT trade risk/reward ratio", () => {
    const res = calculateRiskReward({
      entryPrice: 2715.0,
      stopLossPrice: 2725.0, // $10 risk
      takeProfitPrice: 2690.0, // $25 reward
    });

    expect(res.isValid).toBe(true);
    expect(res.direction).toBe("SHORT");
    expect(res.stopDistanceUsd).toBe(10.0);
    expect(res.targetDistanceUsd).toBe(25.0);
    expect(res.rewardToRiskRatio).toBe(2.5);
  });

  it("rejects invalid or inverted order levels", () => {
    const res = calculateRiskReward({
      entryPrice: 2715.0,
      stopLossPrice: 2720.0, // Higher than entry
      takeProfitPrice: 2730.0, // Also higher than entry
    });

    expect(res.isValid).toBe(false);
    expect(res.direction).toBe("INVALID");
    expect(res.errorMessage).toBeDefined();
  });

  it("calculates exact position sizing and lot size based on account balance and risk percentage", () => {
    const res = calculateRiskReward({
      entryPrice: 2715.0,
      stopLossPrice: 2705.0, // $10 per oz risk
      takeProfitPrice: 2735.0,
      accountBalance: 10000, // $10,000 account
      riskPercent: 1.0, // 1% risk = $100 risk amount
    });

    expect(res.isValid).toBe(true);
    expect(res.riskAmountUsd).toBe(100.0);
    // $100 risk / $10 per oz = 10 troy ounces
    expect(res.estimatedOunces).toBe(10.0);
    // 10 ounces / 100 oz per lot = 0.10 standard lots
    expect(res.estimatedLots).toBe(0.1);
    expect(res.contractSpecs.contractSize).toContain("100 Troy Ounces");
  });
});
