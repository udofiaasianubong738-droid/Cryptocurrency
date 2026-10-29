import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: "Backend is not configured." }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  });
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  const { data: ceo, error: roleError } = await supabase.from("ceo_admins").select("enabled").eq("user_id", user.id).eq("enabled", true).maybeSingle();
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (roleError || !ceo?.enabled || assuranceError || assurance?.currentLevel !== "aal2") {
    return NextResponse.json({ error: "CEO authorization and verified MFA are required." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const [profiles, plans, deposits, withdrawals, quotesResult, assetsResult, providersResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("investment_plans").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("deposit_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("market_quotes").select("id,asset_id,provider,price,change_24h_pct,quote_currency,received_at,source_timestamp,is_delayed").order("received_at", { ascending: false }).limit(250),
    supabase.from("market_assets").select("id,symbol,name").eq("is_enabled", true),
    supabase.from("market_provider_status").select("provider,status,last_success_at,last_error_at,latency_ms,updated_at").order("provider"),
  ]);
  const errors = [profiles.error, plans.error, deposits.error, withdrawals.error, quotesResult.error, assetsResult.error, providersResult.error].filter(Boolean);
  if (errors.length) return NextResponse.json({ error: "One or more read-only dashboard queries failed.", detail: errors.map(e => e?.message) }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const assets = new Map((assetsResult.data || []).map(asset => [asset.id, asset]));
  const seen = new Set<string>();
  const quotes = (quotesResult.data || []).flatMap((quote) => {
    if (seen.has(quote.asset_id)) return [];
    seen.add(quote.asset_id);
    const asset = assets.get(quote.asset_id);
    if (!asset) return [];
    return [{ symbol: asset.symbol, name: asset.name, provider: quote.provider, price: quote.price, change24hPct: quote.change_24h_pct, quoteCurrency: quote.quote_currency, receivedAt: quote.received_at, sourceTimestamp: quote.source_timestamp, delayed: quote.is_delayed }];
  }).slice(0, 12);
  const latestQuoteAt = quotes.reduce<string | null>((latest, quote) => !latest || quote.receivedAt > latest ? quote.receivedAt : latest, null);
  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    counts: { customers: profiles.count ?? 0, activePlans: plans.count ?? 0, pendingDeposits: deposits.count ?? 0, pendingWithdrawals: withdrawals.count ?? 0 },
    quotes,
    providers: providersResult.data || [],
    latestQuoteAt,
  }, { headers: { "Cache-Control": "no-store, max-age=0", "Content-Type": "application/json" } });
}
