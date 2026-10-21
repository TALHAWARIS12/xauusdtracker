"use client";

import { useMarketData } from "@/hooks/useMarketData";
import { GoldSpotCard } from "@/components/market/GoldSpotCard";

interface HomeSpotWidgetProps {
  isPro?: boolean;
}

export function HomeSpotWidget({ isPro = false }: HomeSpotWidgetProps) {
  const market = useMarketData();
  return <GoldSpotCard market={market} isPro={isPro} />;
}
