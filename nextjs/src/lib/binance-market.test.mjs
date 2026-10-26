import test from "node:test";
import assert from "node:assert/strict";
import { BINANCE_SPOT_SYMBOLS, createBinanceMarketFeed } from "./binance-market.mjs";

function tickerPayload(nowMs, ageMs = 10_000) {
  return BINANCE_SPOT_SYMBOLS.map((symbol, index) => ({
    symbol,
    lastPrice: String([80000, 2300, 700][index]),
    priceChangePercent: String([1.25, -0.5, 0][index]),
    closeTime: nowMs - ageMs,
  }));
}

function response(payload, ok = true) {
  return { ok, status: ok ? 200 : 503, json: async () => payload };
}

test("returns validated BTC, ETH and BNB prices as fresh public data", async () => {
  const nowMs = Date.parse("2026-10-26T12:00:00.000Z");
  let requestedUrl = "";
  let requestedOptions;
  const feed = createBinanceMarketFeed({
    now: () => nowMs,
    fetchImpl: async (url, options) => {
      requestedUrl = url;
      requestedOptions = options;
      return response(tickerPayload(nowMs));
    },
  });

  const snapshot = await feed.getSnapshot();
  assert.equal(snapshot.status, "fresh");
  assert.equal(snapshot.provider, "Binance public Spot API");
  assert.deepEqual(snapshot.prices.map((item) => item.symbol), BINANCE_SPOT_SYMBOLS);
  assert.equal(snapshot.prices[0].price, 80000);
  assert.equal(snapshot.prices[1].changePercent24h, -0.5);
  assert.match(requestedUrl, /^https:\/\/data-api\.binance\.vision\/api\/v3\/ticker\/24hr\?/);
  assert.doesNotMatch(requestedUrl, /apiKey|signature|secret/i);
  assert.deepEqual(requestedOptions.headers, { Accept: "application/json" });
  assert.equal(requestedOptions.cache, "no-store");
});

test("marks ticker timestamps older than two minutes as stale", async () => {
  const nowMs = Date.parse("2026-10-26T12:00:00.000Z");
  const feed = createBinanceMarketFeed({
    now: () => nowMs,
    fetchImpl: async () => response(tickerPayload(nowMs, 180_000)),
  });

  const snapshot = await feed.getSnapshot();
  assert.equal(snapshot.status, "stale");
  assert.ok(snapshot.staleAgeSeconds >= 180);
  assert.match(snapshot.message, /marked stale/i);
});

test("returns unavailable with no fabricated prices when the first fetch fails", async () => {
  const feed = createBinanceMarketFeed({
    now: () => Date.parse("2026-10-26T12:00:00.000Z"),
    fetchImpl: async () => { throw new Error("network unavailable"); },
  });

  const snapshot = await feed.getSnapshot();
  assert.equal(snapshot.status, "unavailable");
  assert.deepEqual(snapshot.prices, []);
  assert.equal(snapshot.fetchedAt, null);
});

test("preserves the last successful snapshot as stale after a refresh failure", async () => {
  const nowValues = [
    Date.parse("2026-10-26T12:00:00.000Z"),
    Date.parse("2026-10-26T12:00:45.000Z"),
  ];
  let callCount = 0;
  const feed = createBinanceMarketFeed({
    now: () => nowValues[Math.min(callCount, nowValues.length - 1)],
    fetchImpl: async () => {
      callCount += 1;
      if (callCount === 1) return response(tickerPayload(nowValues[0]));
      throw new Error("temporary network failure");
    },
  });

  const first = await feed.getSnapshot();
  const second = await feed.getSnapshot();
  assert.equal(first.status, "fresh");
  assert.equal(second.status, "stale");
  assert.deepEqual(second.prices, first.prices);
  assert.equal(second.staleAgeSeconds, 45);
  assert.match(second.message, /last successful snapshot/i);
});
