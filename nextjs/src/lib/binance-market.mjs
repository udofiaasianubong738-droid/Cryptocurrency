export const BINANCE_SPOT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT"];

const ENDPOINT =
  "https://data-api.binance.vision/api/v3/ticker/24hr?symbols=" +
  encodeURIComponent(JSON.stringify(BINANCE_SPOT_SYMBOLS));

function parseTickers(payload, fetchedAt) {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected Binance ticker response.");
  }

  const bySymbol = new Map(payload.map((item) => [item?.symbol, item]));
  const prices = BINANCE_SPOT_SYMBOLS.map((symbol) => {
    const ticker = bySymbol.get(symbol);
    const price = Number(ticker?.lastPrice);
    const changePercent = Number(ticker?.priceChangePercent);

    if (
      !ticker ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(changePercent)
    ) {
      throw new Error(`Missing or invalid ticker data for ${symbol}.`);
    }

    return {
      symbol,
      baseAsset: symbol.replace("USDT", ""),
      quoteAsset: "USDT",
      price,
      changePercent24h: changePercent,
      exchangeUpdatedAt:
        Number.isFinite(Number(ticker.closeTime)) && Number(ticker.closeTime) > 0
          ? new Date(Number(ticker.closeTime)).toISOString()
          : null,
    };
  });

  return {
    status: "fresh",
    provider: "Binance public Spot API",
    prices,
    fetchedAt,
    staleAgeSeconds: 0,
    message: "Live public market data fetched successfully.",
  };
}

export function createBinanceMarketFeed({
  fetchImpl = globalThis.fetch,
  now = () => Date.now(),
  timeoutMs = 5000,
} = {}) {
  let lastGoodSnapshot = null;

  return {
    async getSnapshot() {
      const checkedAt = new Date(now()).toISOString();

      try {
        const response = await fetchImpl(ENDPOINT, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          throw new Error(`Binance returned HTTP ${response.status}.`);
        }

        const snapshot = parseTickers(await response.json(), checkedAt);
        lastGoodSnapshot = snapshot;
        return { ...snapshot, checkedAt };
      } catch {
        if (lastGoodSnapshot) {
          return {
            ...lastGoodSnapshot,
            status: "stale",
            checkedAt,
            staleAgeSeconds: Math.max(
              0,
              Math.floor((now() - Date.parse(lastGoodSnapshot.fetchedAt)) / 1000),
            ),
            message:
              "The latest refresh failed. Showing the last successful snapshot; prices may be outdated.",
          };
        }

        return {
          status: "unavailable",
          provider: "Binance public Spot API",
          prices: [],
          fetchedAt: null,
          checkedAt,
          staleAgeSeconds: null,
          message:
            "Market data is unavailable. No prices are shown until a fresh response is received.",
        };
      }
    },
  };
}
