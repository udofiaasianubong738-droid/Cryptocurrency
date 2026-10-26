export const BINANCE_SPOT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT"];

const ENDPOINT =
  "https://data-api.binance.vision/api/v3/ticker/24hr?symbols=" +
  encodeURIComponent(JSON.stringify(BINANCE_SPOT_SYMBOLS));
const STALE_AFTER_MS = 120_000;
const ALLOWED_FUTURE_SKEW_MS = 30_000;

function parseTickers(payload, fetchedAt, nowMs) {
  if (!Array.isArray(payload)) {
    throw new Error("Unexpected Binance ticker response.");
  }

  const bySymbol = new Map(payload.map((item) => [item?.symbol, item]));
  const prices = BINANCE_SPOT_SYMBOLS.map((symbol) => {
    const ticker = bySymbol.get(symbol);
    const price = Number(ticker?.lastPrice);
    const changePercent = Number(ticker?.priceChangePercent);
    const closeTime = Number(ticker?.closeTime);

    if (
      !ticker ||
      !Number.isFinite(price) ||
      price <= 0 ||
      !Number.isFinite(changePercent) ||
      !Number.isFinite(closeTime) ||
      closeTime <= 0
    ) {
      throw new Error(`Missing or invalid ticker data for ${symbol}.`);
    }

    return {
      symbol,
      baseAsset: symbol.slice(0, -4),
      quoteAsset: "USDT",
      price,
      changePercent24h: changePercent,
      exchangeUpdatedAt: new Date(closeTime).toISOString(),
    };
  });

  const ages = prices.map((price) => nowMs - Date.parse(price.exchangeUpdatedAt));
  const stale = ages.some(
    (age) => age > STALE_AFTER_MS || age < -ALLOWED_FUTURE_SKEW_MS,
  );

  return {
    status: stale ? "stale" : "fresh",
    provider: "Binance public Spot API",
    prices,
    fetchedAt,
    staleAgeSeconds: stale
      ? Math.max(0, Math.floor(Math.max(...ages) / 1000))
      : 0,
    message: stale
      ? "Binance responded, but one or more ticker timestamps are outside the freshness threshold. Values are marked stale."
      : "Live public market data fetched successfully.",
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
      const nowMs = now();
      const checkedAt = new Date(nowMs).toISOString();

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

        const snapshot = parseTickers(await response.json(), checkedAt, nowMs);
        if (snapshot.status === "fresh") {
          lastGoodSnapshot = snapshot;
        }
        return { ...snapshot, checkedAt };
      } catch {
        if (lastGoodSnapshot) {
          return {
            ...lastGoodSnapshot,
            status: "stale",
            checkedAt,
            staleAgeSeconds: Math.max(
              0,
              Math.floor((nowMs - Date.parse(lastGoodSnapshot.fetchedAt)) / 1000),
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
