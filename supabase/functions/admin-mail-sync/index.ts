import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
function claimsFrom(token: string) { const part = token.split(".")[1]; if (!part) return null; try { return JSON.parse(atob(part.replace(/-/g,"+").replace(/_/g,"/"))) as Record<string, unknown>; } catch { return null; } }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return reply({ error: "Bearer session required" }, 401);
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret) return reply({ error: "Server Supabase environment is incomplete" }, 503);
  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return reply({ error: "Session could not be verified" }, 401);
  if (claimsFrom(token)?.aal !== "aal2") return reply({ error: "A verified AAL2 session is required" }, 403);
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: ceo, error: ceoError } = await admin.from("ceo_admins").select("user_id,enabled").eq("user_id", userData.user.id).eq("enabled", true).maybeSingle();
  if (ceoError) return reply({ error: "CEO authorization check failed" }, 500);
  if (!ceo) return reply({ error: "CEO administrator authorization required" }, 403);

  const tenant = Deno.env.get("MICROSOFT_TENANT_ID"), clientId = Deno.env.get("MICROSOFT_CLIENT_ID"), clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET"), sender = Deno.env.get("MICROSOFT_SENDER_EMAIL");
  if (!tenant || !clientId || !clientSecret || !sender) return reply({ error: "Microsoft Graph credentials and sender mailbox must be configured in Supabase Function Secrets." }, 503);
  const tokenResponse = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" }) });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token) return reply({ error: "Microsoft identity token request failed", detail: tokenData.error_description || tokenData.error || `HTTP ${tokenResponse.status}` }, 502);

  const mailbox = encodeURIComponent(sender);
  const graphResponse = await fetch(`https://graph.microsoft.com/v1.0/users/${mailbox}/mailFolders/inbox/messages?$top=50&$orderby=receivedDateTime%20desc&$select=id,internetMessageId,from,toRecipients,subject,body,bodyPreview,receivedDateTime,isRead`, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
  const graphData = await graphResponse.json().catch(() => ({}));
  if (!graphResponse.ok) return reply({ error: "Microsoft Graph inbox read failed", provider_status: graphResponse.status, detail: graphData.error?.message || "No provider detail" }, 502);

  const messages = (graphData.value || []).map((m: any) => ({
    provider: "microsoft_graph",
    provider_message_id: m.id,
    sender_email: m.from?.emailAddress?.address || "unknown",
    recipient_email: m.toRecipients?.[0]?.emailAddress?.address || sender,
    subject: String(m.subject || "(no subject)").slice(0,500),
    body_text: String(m.body?.content || m.bodyPreview || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"' ).replace(/&#39;/gi, "'").replace(/\\s+/g, " ").trim().slice(0,30000),
    received_at: m.receivedDateTime || new Date().toISOString(),
    status: "untriaged",
    metadata: { internet_message_id: m.internetMessageId || null, is_read: Boolean(m.isRead) }
  }));
  if (messages.length) {
    const { error } = await admin.from("admin_inbound_messages").upsert(messages, { onConflict: "provider,provider_message_id", ignoreDuplicates: true });
    if (error) return reply({ error: "Could not persist inbound mailbox messages", detail: error.message }, 500);
  }
  const { error: auditError } = await admin.from("audit_logs").insert({ actor_user_id: userData.user.id, action: "admin_mailbox_synced", entity_type: "admin_inbound_messages", entity_id: null, request_id: req.headers.get("x-request-id"), metadata: { messages_fetched: messages.length, mailbox: sender } });
  return reply({ ok: true, messages_fetched: messages.length, audit_recorded: !auditError, note: "Only inbox metadata and message previews are synced. Microsoft Graph Mail.Read application permission and admin consent are required." });
});
