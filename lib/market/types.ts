export interface Candle {
  time: number; // UTC timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SwingLevels {
  swingHigh: number;
  swingLow: number;
  range: number;
}

export interface ZoneRange {
  min: number;
  max: number;
}

export interface LiquidityZones {
  buyerSLZone: ZoneRange;
  sellerSLZone: ZoneRange;
  buyerTPZone: number;
  sellerTPZone: number;
}

export interface VolumeDistribution {
  bullVolume: number;
  bearVolume: number;
  totalVolume: number;
  bullRatio: number; // 0 to 1
  bearRatio: number; // 0 to 1
  buyerHeadcount: number;
  sellerHeadcount: number;
  buySideNotionalBillion: number; // in $ billions
  sellSideNotionalBillion: number; // in $ billions
}

export type ConnectionMode = "connecting" | "websocket" | "polling" | "error";

export interface Ticker24h {
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
}

export interface MarketDataState {
  currentPrice: number;
  previousPrice: number;
  candles: Candle[];
  latestCandle: Candle | null;
  swingLevels: SwingLevels | null;
  liquidityZones: LiquidityZones | null;
  volumeDistribution: VolumeDistribution | null;
  stats24h: Ticker24h | null;
  connectionMode: ConnectionMode;
  lastUpdated: number; // UTC ms
  error: string | null;
  isFallback: boolean;
}
