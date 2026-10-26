export type FeedStatus = "fresh" | "stale" | "unavailable";

export type MarketPrice = {
  symbol: string;
  baseAsset: string;
  quoteAsset: "USDT";
  price: number;
  changePercent24h: number;
  exchangeUpdatedAt: string | null;
};

export type MarketSnapshot = {
  status: FeedStatus;
  provider: string;
  prices: MarketPrice[];
  fetchedAt: string | null;
  checkedAt: string;
  staleAgeSeconds: number | null;
  message: string;
};

export const BINANCE_SPOT_SYMBOLS: readonly string[];

export function createBinanceMarketFeed(options?: {
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
}): {
  getSnapshot(): Promise<MarketSnapshot>;
};
