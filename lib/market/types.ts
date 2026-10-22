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
  volumeDelta?: number;
  tradesCount?: number;
}

export type ConnectionMode = "connecting" | "websocket" | "polling" | "error";
export type WebSocketStatus = "Live Connected" | "Reconnecting" | "Offline";

export interface OrderBookLevel {
  price: number;
  qty: number;
  total?: number;
  percent?: number;
}

export interface LiveOrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  lastUpdateId?: number;
  timestamp: number;
}

export interface LiveOrderFlow {
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  delta: number;
  buyRatio: number;
  sellRatio: number;
  recentTradesCount: number;
  lastTradeSide?: "BUY" | "SELL";
  lastTradePrice?: number;
  lastTradeQty?: number;
}

export interface Ticker24h {
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  quoteVolume?: number;
  priceChangePercent?: number;
}

export interface MarketDataState {
  currentPrice: number;
  previousPrice: number;
  candles: Candle[];
  latestCandle: Candle | null;
  swingLevels: SwingLevels | null;
  liquidityZones: LiquidityZones | null;
  volumeDistribution: VolumeDistribution | null;
  orderBook?: LiveOrderBook | null;
  orderFlow?: LiveOrderFlow | null;
  stats24h: Ticker24h | null;
  connectionMode: ConnectionMode;
  wsStatus: WebSocketStatus;
  lastUpdated: number; // UTC ms
  error: string | null;
  isFallback: boolean;
  source?: string;
  latencyMs?: number;
  markPrice?: number;
  indexPrice?: number;
  underlyingInstrument?: string;
  benchmarkAsset?: string;
}
