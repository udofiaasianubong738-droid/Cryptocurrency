import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function readJwtClaims(token: string): Record<string, unknown> {
  const part = token.split(".")[1];
  if (!part) throw new Error("Invalid access token");
  const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(atob(base64)) as Record<string, unknown>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST required" }, 405);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return json({ error: "Missing bearer session" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return json({ error: "Server Supabase environment is incomplete" }, 503);

  const userClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userResult, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userResult.user) return json({ error: "Session could not be verified" }, 401);

  let claims: Record<string, unknown>;
  try { claims = readJwtClaims(token); } catch { return json({ error: "Session claims are invalid" }, 401); }
  if (claims.aal !== "aal2") return json({ error: "A verified AAL2 session is required" }, 403);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: ceo, error: ceoError } = await admin.from("ceo_admins").select("user_id,enabled").eq("user_id", userResult.user.id).eq("enabled", true).maybeSingle();
  if (ceoError) return json({ error: "CEO authorization check failed" }, 500);
  if (!ceo) return json({ error: "CEO administrator authorization required" }, 403);

  const findings: Array<{ finding_type: string; severity: string; title: string; summary: string; recommendation: string; source_table: string | null; evidence: Record<string, unknown> }> = [];
  const now = new Date();
  const oldCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const recentCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const [market, failedMail, staleOutcomes, profiles, settings, authUsers] = await Promise.all([
    admin.from("market_analytics_snapshots").select("id,provider,captured_at,tracked_assets,quoted_assets,fresh_assets,provider_latency_ms").order("captured_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("admin_email_outbox").select("id", { count: "exact", head: true }).eq("status", "failed"),
    admin.from("investment_outcome_proposals").select("id", { count: "exact", head: true }).eq("status", "pending_review").lt("created_at", oldCutoff),
    admin.from("profiles").select("id", { count: "exact", head: true }),
    admin.from("user_settings").select("user_id", { count: "exact", head: true }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (market.error) {
    findings.push({ finding_type: "market_data", severity: "high", title: "Market snapshot query failed", summary: "The latest market snapshot could not be read by the monitoring function.", recommendation: "Check market-data table permissions, provider ingestion, and function logs.", source_table: "market_analytics_snapshots", evidence: { error: market.error.message } });
  } else if (!market.data) {
    findings.push({ finding_type: "market_data", severity: "high", title: "No market analytics snapshot", summary: "No market analytics snapshot exists yet, so data freshness and provider coverage cannot be verified.", recommendation: "Check that the market ingestion job is configured and producing snapshots before relying on market indicators.", source_table: "market_analytics_snapshots", evidence: {} });
  } else {
    const ageMinutes = Math.floor((now.getTime() - new Date(market.data.captured_at).getTime()) / 60000);
    if (ageMinutes > 30) findings.push({ finding_type: "market_data", severity: ageMinutes > 120 ? "high" : "medium", title: "Market snapshot is stale", summary: `The latest market snapshot is approximately ${ageMinutes} minutes old.`, recommendation: "Check provider connectivity and scheduled market ingestion. Do not use stale quotes for decisions.", source_table: "market_analytics_snapshots", evidence: { provider: market.data.provider, captured_at: market.data.captured_at, age_minutes: ageMinutes } });
    if (Number(market.data.tracked_assets || 0) > Number(market.data.fresh_assets || 0)) findings.push({ finding_type: "data_quality", severity: "medium", title: "Market quote coverage is incomplete", summary: `${market.data.fresh_assets} of ${market.data.tracked_assets} tracked assets are reported fresh in the latest snapshot.`, recommendation: "Review stale and missing asset quotes and verify the provider's freshness rules.", source_table: "market_analytics_snapshots", evidence: { tracked_assets: market.data.tracked_assets, quoted_assets: market.data.quoted_assets, fresh_assets: market.data.fresh_assets } });
    if (Number(market.data.provider_latency_ms || 0) > 5000) findings.push({ finding_type: "service_health", severity: "medium", title: "Market provider latency is elevated", summary: `Latest recorded provider latency is ${market.data.provider_latency_ms} ms.`, recommendation: "Check provider status, timeouts, retry behavior, and rate limits.", source_table: "market_analytics_snapshots", evidence: { provider: market.data.provider, provider_latency_ms: market.data.provider_latency_ms } });
  }

  if (failedMail.error) {
    findings.push({ finding_type: "workflow", severity: "medium", title: "Email delivery status query failed", summary: "The monitoring scan could not read failed email records.", recommendation: "Check email workspace table permissions and provider status.", source_table: "admin_email_outbox", evidence: { error: failedMail.error.message } });
  } else if ((failedMail.count || 0) > 0) {
    findings.push({ finding_type: "workflow", severity: "medium", title: "Email delivery failures need review", summary: `${failedMail.count} email outbox item(s) are marked failed.`, recommendation: "Inspect provider error details and recipient validity. Retry only after the root cause is understood.", source_table: "admin_email_outbox", evidence: { failed_count: failedMail.count } });
  }

  if (!staleOutcomes.error && (staleOutcomes.count || 0) > 0) {
    findings.push({ finding_type: "workflow", severity: "medium", title: "Investment outcomes awaiting review", summary: `${staleOutcomes.count} investment outcome proposal(s) have remained pending for over 24 hours.`, recommendation: "Review supporting evidence and customer wording. Do not convert a proposal into a balance or ledger mutation.", source_table: "investment_outcome_proposals", evidence: { pending_over_24h: staleOutcomes.count } });
  }

  if (!authUsers.error && !profiles.error && !settings.error && authUsers.data.users.length < 1000) {
    const userCount = authUsers.data.users.length;
    if ((profiles.count || 0) < userCount || (settings.count || 0) < userCount) {
      findings.push({ finding_type: "data_quality", severity: "medium", title: "User bootstrap records may be incomplete", summary: `Auth has ${userCount} user(s), profiles has ${profiles.count || 0}, and user settings has ${settings.count || 0}.`, recommendation: "Inspect signup bootstrap trigger and reconcile missing profile/settings rows without overwriting existing user preferences.", source_table: "profiles", evidence: { auth_user_count: userCount, profile_count: profiles.count || 0, settings_count: settings.count || 0 } });
    }
  } else if (authUsers.error || profiles.error || settings.error) {
    findings.push({ finding_type: "data_quality", severity: "low", title: "User record completeness check unavailable", summary: "The monitoring scan could not compare Auth users with profile and settings records.", recommendation: "Inspect the Auth Admin API and user table permissions.", source_table: "profiles", evidence: { auth_error: authUsers.error?.message, profiles_error: profiles.error?.message, settings_error: settings.error?.message } });
  }

  const saved: string[] = [];
  const skippedDuplicates: string[] = [];
  for (const finding of findings) {
    const { data: existing, error: duplicateError } = await admin.from("admin_ai_findings").select("id").eq("status", "open").eq("title", finding.title).gte("detected_at", recentCutoff).limit(1);
    if (duplicateError) return json({ error: "Could not check finding idempotency", detail: duplicateError.message }, 500);
    if (existing && existing.length > 0) { skippedDuplicates.push(finding.title); continue; }
    const { data: inserted, error: insertError } = await admin.from("admin_ai_findings").insert({ ...finding, status: "open", detected_at: now.toISOString() }).select("id").single();
    if (insertError) return json({ error: "Could not save monitoring finding", detail: insertError.message }, 500);
    saved.push(inserted.id);
  }

  const runId = crypto.randomUUID();
  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_user_id: userResult.user.id,
    action: "admin_ai_monitor_run",
    entity_type: "admin_ai_monitor",
    entity_id: runId,
    request_id: req.headers.get("x-request-id"),
    metadata: { checks_run: 6, findings_detected: findings.length, findings_saved: saved.length, duplicate_findings_skipped: skippedDuplicates.length, financial_operations_enabled: false },
  });

  return json({
    ok: true,
    run_id: runId,
    checks_run: 6,
    findings_detected: findings.length,
    findings_saved: saved.length,
    duplicate_findings_skipped: skippedDuplicates.length,
    finding_ids: saved,
    audit_recorded: !auditError,
    audit_warning: auditError?.message,
    note: "Rule-based monitoring only. This function does not execute financial operations, send email, or use a generative AI model.",
  });
});
