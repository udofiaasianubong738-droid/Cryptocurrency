import { createBinanceMarketFeed } from "../../../lib/binance-market.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const feed = createBinanceMarketFeed();

export async function GET() {
  const snapshot = await feed.getSnapshot();
  const unavailable = snapshot.status === "unavailable";

  return Response.json(snapshot, {
    status: unavailable ? 503 : 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
