import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT","DOTUSDT"];
type Ticker = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
  closeTime: number;
};

export async function GET() {
  const url = new URL("https://data-api.binance.vision/api/v3/ticker/24hr");
  url.searchParams.set("symbols", JSON.stringify(symbols));

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Market provider temporarily unavailable", provider: "Binance Spot", updatedAt: null },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return NextResponse.json(
        { error: "Market provider returned an unexpected response", provider: "Binance Spot", updatedAt: null },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const quotes = (payload as Ticker[])
      .filter((t) => t && typeof t.symbol === "string" && symbols.includes(t.symbol))
      .map((t) => ({
        symbol: t.symbol.replace(/USDT$/, ""),
        pair: t.symbol,
        price: Number(t.lastPrice),
        change24hPct: Number(t.priceChangePercent),
        high24h: Number(t.highPrice),
        low24h: Number(t.lowPrice),
        volume24hQuote: Number(t.quoteVolume),
        quoteCurrency: "USDT",
        source: "Binance Spot",
        sourceTimestamp: Number.isFinite(t.closeTime) ? new Date(t.closeTime).toISOString() : null,
      }))
      .filter((q) => [q.price, q.change24hPct, q.high24h, q.low24h, q.volume24hQuote].every(Number.isFinite));

    if (!quotes.length) {
      return NextResponse.json(
        { error: "No valid market quotes were returned", provider: "Binance Spot", updatedAt: null },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { provider: "Binance Spot", updatedAt: new Date().toISOString(), quotes },
      { headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not reach the market provider", provider: "Binance Spot", updatedAt: null },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
