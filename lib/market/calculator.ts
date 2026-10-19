export interface RiskRewardInput {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  accountBalance?: number;
  riskPercent?: number;
}

export interface RiskRewardResult {
  isValid: boolean;
  errorMessage?: string;
  direction: "LONG" | "SHORT" | "INVALID";
  stopDistanceUsd: number;
  targetDistanceUsd: number;
  stopDistancePips: number;
  targetDistancePips: number;
  rewardToRiskRatio: number;
  riskAmountUsd?: number;
  estimatedLots?: number;
  estimatedOunces?: number;
  contractSpecs: {
    contractSize: string;
    pipValuePerLot: string;
    note: string;
  };
}

export function calculateRiskReward(input: RiskRewardInput): RiskRewardResult {
  const { entryPrice, stopLossPrice, takeProfitPrice, accountBalance, riskPercent } = input;

  const defaultSpecs = {
    contractSize: "100 Troy Ounces per Standard Lot (1.00 lot)",
    pipValuePerLot: "$1.00 per $0.01 price move per lot",
    note: "Calculated assuming standard institutional 100 oz contract. Check broker leverage and margin limits.",
  };

  if (!Number.isFinite(entryPrice) || entryPrice <= 0) {
    return {
      isValid: false,
      errorMessage: "Please enter a valid positive Entry Price.",
      direction: "INVALID",
      stopDistanceUsd: 0,
      targetDistanceUsd: 0,
      stopDistancePips: 0,
      targetDistancePips: 0,
      rewardToRiskRatio: 0,
      contractSpecs: defaultSpecs,
    };
  }

  if (!Number.isFinite(stopLossPrice) || stopLossPrice <= 0) {
    return {
      isValid: false,
      errorMessage: "Please enter a valid positive Stop-Loss Price.",
      direction: "INVALID",
      stopDistanceUsd: 0,
      targetDistanceUsd: 0,
      stopDistancePips: 0,
      targetDistancePips: 0,
      rewardToRiskRatio: 0,
      contractSpecs: defaultSpecs,
    };
  }

  if (!Number.isFinite(takeProfitPrice) || takeProfitPrice <= 0) {
    return {
      isValid: false,
      errorMessage: "Please enter a valid positive Take-Profit Price.",
      direction: "INVALID",
      stopDistanceUsd: 0,
      targetDistanceUsd: 0,
      stopDistancePips: 0,
      targetDistancePips: 0,
      rewardToRiskRatio: 0,
      contractSpecs: defaultSpecs,
    };
  }

  let direction: "LONG" | "SHORT" | "INVALID" = "INVALID";

  if (takeProfitPrice > entryPrice && stopLossPrice < entryPrice) {
    direction = "LONG";
  } else if (takeProfitPrice < entryPrice && stopLossPrice > entryPrice) {
    direction = "SHORT";
  } else {
    return {
      isValid: false,
      errorMessage:
        "Invalid order setup: For a LONG position, Take-Profit must be above Entry and Stop-Loss below Entry. For a SHORT position, Take-Profit must be below Entry and Stop-Loss above Entry.",
      direction: "INVALID",
      stopDistanceUsd: 0,
      targetDistanceUsd: 0,
      stopDistancePips: 0,
      targetDistancePips: 0,
      rewardToRiskRatio: 0,
      contractSpecs: defaultSpecs,
    };
  }

  const stopDistanceUsd = Number(Math.abs(entryPrice - stopLossPrice).toFixed(2));
  const targetDistanceUsd = Number(Math.abs(takeProfitPrice - entryPrice).toFixed(2));

  // 1 pip in gold is 0.10 (10 cents), or 0.01 depending on terminal precision; standard convention is 0.10 = 1 pip
  const stopDistancePips = Number((stopDistanceUsd * 10).toFixed(1));
  const targetDistancePips = Number((targetDistanceUsd * 10).toFixed(1));

  const rewardToRiskRatio =
    stopDistanceUsd > 0 ? Number((targetDistanceUsd / stopDistanceUsd).toFixed(2)) : 0;

  let riskAmountUsd: number | undefined;
  let estimatedLots: number | undefined;
  let estimatedOunces: number | undefined;

  if (
    accountBalance !== undefined &&
    accountBalance > 0 &&
    riskPercent !== undefined &&
    riskPercent > 0 &&
    stopDistanceUsd > 0
  ) {
    riskAmountUsd = Number(((accountBalance * riskPercent) / 100).toFixed(2));
    // Each standard lot is 100 oz. A $1 move per oz = $100 per lot.
    // Risk = stopDistanceUsd * ounces => ounces = riskAmount / stopDistanceUsd
    const ounces = riskAmountUsd / stopDistanceUsd;
    estimatedOunces = Number(ounces.toFixed(2));
    estimatedLots = Number((ounces / 100).toFixed(2));
  }

  return {
    isValid: true,
    direction,
    stopDistanceUsd,
    targetDistanceUsd,
    stopDistancePips,
    targetDistancePips,
    rewardToRiskRatio,
    riskAmountUsd,
    estimatedLots,
    estimatedOunces,
    contractSpecs: defaultSpecs,
  };
}
