"use client";

import { useCallback, useEffect, useState } from "react";

type FeedStatus = "fresh" | "stale" | "unavailable";
type MarketPrice = {
  symbol: string;
  baseAsset: string;
  quoteAsset: "USDT";
  price: number;
  changePercent24h: number;
  exchangeUpdatedAt: string | null;
};
type MarketSnapshot = {
  status: FeedStatus;
  provider: string;
  prices: MarketPrice[];
  fetchedAt: string | null;
  checkedAt: string;
  staleAgeSeconds: number | null;
  message: string;
};

function formatPrice(price: number) {
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: price >= 100 ? 2 : 6,
  });
}

function formatTime(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function BinanceMarketWidget() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/market", { cache: "no-store" });
      const data = (await response.json()) as MarketSnapshot;
      if (
        !data ||
        !["fresh", "stale", "unavailable"].includes(data.status) ||
        !Array.isArray(data.prices)
      ) {
        throw new Error("Unexpected market feed response.");
      }
      if (!response.ok) {
        throw new Error(data.message || "Market feed is unavailable.");
      }
      setSnapshot(data);
    } catch {
      setSnapshot((previous) => {
        if (previous?.status === "fresh" || previous?.status === "stale") {
          const now = Date.now();
          return {
            ...previous,
            status: "stale",
            checkedAt: new Date(now).toISOString(),
            staleAgeSeconds: previous.fetchedAt
              ? Math.max(0, Math.floor((now - Date.parse(previous.fetchedAt)) / 1000))
              : null,
            message: "The dashboard could not refresh. Showing the previous snapshot; prices may be outdated.",
          };
        }
        return {
          status: "unavailable",
          provider: "Binance public Spot API",
          prices: [],
          fetchedAt: null,
          checkedAt: new Date().toISOString(),
          staleAgeSeconds: null,
          message: "Market data could not be reached. No prices are shown.",
        };
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const status = snapshot?.status ?? "unavailable";
  const statusLabel =
    status === "fresh" ? "Live data" : status === "stale" ? "Stale snapshot" : "Unavailable";
  const updatedTime = formatTime(snapshot?.fetchedAt ?? null);

  return (
    <section className="surface-card market-card" aria-labelledby="market-heading" aria-live="polite">
      <div className="section-title-row market-heading-row">
        <div>
          <p className="section-kicker">PUBLIC MARKET DATA</p>
          <h2 id="market-heading">Spot market watch</h2>
          <p className="section-description">10 tracked crypto spot pairs · 24-hour change</p>
        </div>
        <div className="market-status-wrap">
          <span className={`market-status market-status-${status}`}>
            <span aria-hidden="true" />
            {statusLabel}
          </span>
          <button className="market-refresh" type="button" onClick={() => void refresh()} disabled={refreshing}>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {snapshot?.prices.length ? (
        <div className="market-price-grid">
          {snapshot.prices.map((item) => (
            <article className="market-price-item" key={item.symbol}>
              <div className="market-asset-heading">
                <strong>{item.baseAsset}</strong>
                <span>{item.symbol}</span>
              </div>
              <p className="market-price">{formatPrice(item.price)} <span>USDT</span></p>
              <p className={item.changePercent24h > 0 ? "market-change market-up" : item.changePercent24h < 0 ? "market-change market-down" : "market-change"}>
                {item.changePercent24h > 0 ? "+" : ""}{item.changePercent24h.toFixed(2)}% <span>24h</span>
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="market-empty">
          <strong>Prices not available</strong>
          <p>We will not display invented or unverified market values.</p>
        </div>
      )}

      <div className="market-footnote">
        <p>{snapshot?.message ?? "Waiting for the first successful public-data response."}</p>
        <p>
          Source: Binance public Spot API ·{" "}
          {status === "stale"
            ? `Last successful fetch ${updatedTime ?? "time unknown"} · snapshot age ${snapshot?.staleAgeSeconds ?? "unknown"}s`
            : status === "fresh"
              ? `Fetched ${updatedTime ?? "time unknown"}`
              : "No successful fetch yet"}
        </p>
        <p>Market prices are informational, not account balances or trade execution prices.</p>
      </div>
    </section>
  );
}
