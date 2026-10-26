import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const symbols = ["BTCUSDT","ETHUSDT","BNBUSDT","SOLUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","AVAXUSDT","LINKUSDT","DOTUSDT"];
type Ticker = { symbol:string; lastPrice:string; priceChangePercent:string; highPrice:string; lowPrice:string; quoteVolume:string; closeTime:number };

export async function GET() {
  try {
    const url = new URL("https://api.binance.com/api/v3/ticker/24hr");
    url.searchParams.set("symbols", JSON.stringify(symbols));
    const response = await fetch(url, { cache: "no-store", headers: { accept: "application/json" }, signal: AbortSignal.timeout(8000) });
    if (!response.ok) return NextResponse.json({ error: "Market provider temporarily unavailable", provider: "Binance", updatedAt: null }, { status: 502 });
    const data = await response.json() as Ticker[];
    const quotes = data.map((t) => ({
      symbol: t.symbol.replace(/USDT$/, ""),
      pair: t.symbol,
      price: Number(t.lastPrice),
      change24hPct: Number(t.priceChangePercent),
      high24h: Number(t.highPrice),
      low24h: Number(t.lowPrice),
      volume24hQuote: Number(t.quoteVolume),
      quoteCurrency: "USDT",
      source: "Binance Spot",
      sourceTimestamp: new Date(t.closeTime).toISOString(),
    }));
    return NextResponse.json({ provider: "Binance Spot", updatedAt: new Date().toISOString(), quotes }, {
      headers: { "Cache-Control": "no-store, max-age=0", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the market provider", provider: "Binance", updatedAt: null }, { status: 502 });
  }
}
