import test from "node:test";
import assert from "node:assert/strict";
import {
  BINANCE_SPOT_SYMBOLS,
  createBinanceMarketFeed,
} from "../src/lib/binance-market.mjs";

function tickerPayload() {
  return BINANCE_SPOT_SYMBOLS.map((symbol, index) => ({
    symbol,
    lastPrice: String(65000 + index * 100),
    priceChangePercent: String(index - 1.25),
    closeTime: 1700000000000,
  }));
}

function okResponse(body) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

test("returns validated prices with fresh status", async () => {
  const feed = createBinanceMarketFeed({
    fetchImpl: async () => okResponse(tickerPayload()),
    now: () => 1700000000000,
  });

  const result = await feed.getSnapshot();

  assert.equal(result.status, "fresh");
  assert.equal(result.provider, "Binance public Spot API");
  assert.deepEqual(
    result.prices.map((item) => item.symbol),
    BINANCE_SPOT_SYMBOLS,
  );
  assert.equal(result.prices[0].price, 65000);
  assert.equal(result.prices[0].changePercent24h, -1.25);
  assert.equal(result.staleAgeSeconds, 0);
});

test("labels cached prices stale after a failed refresh", async () => {
  let clock = 1700000000000;
  let shouldFail = false;
  const feed = createBinanceMarketFeed({
    fetchImpl: async () => {
      if (shouldFail) throw new Error("network unavailable");
      return okResponse(tickerPayload());
    },
    now: () => clock,
  });

  assert.equal((await feed.getSnapshot()).status, "fresh");
  shouldFail = true;
  clock += 40000;

  const result = await feed.getSnapshot();

  assert.equal(result.status, "stale");
  assert.equal(result.staleAgeSeconds, 40);
  assert.match(result.message, /refresh failed/i);
  assert.equal(result.prices.length, 3);
});

test("shows unavailable with no fabricated prices before first success", async () => {
  const feed = createBinanceMarketFeed({
    fetchImpl: async () => ({ ok: false, status: 503 }),
    now: () => 1700000000000,
  });

  const result = await feed.getSnapshot();

  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.prices, []);
  assert.equal(result.fetchedAt, null);
  assert.match(result.message, /no prices are shown/i);
});

test("rejects incomplete ticker payloads instead of showing partial data as fresh", async () => {
  const feed = createBinanceMarketFeed({
    fetchImpl: async () => okResponse(tickerPayload().slice(0, 1)),
    now: () => 1700000000000,
  });

  const result = await feed.getSnapshot();

  assert.equal(result.status, "unavailable");
  assert.deepEqual(result.prices, []);
});
