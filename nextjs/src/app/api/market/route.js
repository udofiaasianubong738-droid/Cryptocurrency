import { createBinanceMarketFeed } from "../../../lib/binance-market.mjs";

const feed = createBinanceMarketFeed();

export async function GET() {
  const snapshot = await feed.getSnapshot();

  return Response.json(snapshot, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
