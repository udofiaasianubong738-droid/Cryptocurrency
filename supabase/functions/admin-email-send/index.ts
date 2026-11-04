import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

function claimsFrom(token: string) { const part = token.split(".")[1]; if (!part) return null; try { return JSON.parse(atob(part.replace(/-/g,"+").replace(/_/g,"/"))) as Record<string, unknown>; } catch { return null; } }

async function authContext(req: Request) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { error: reply({ error: "Bearer session required" }, 401) } as const;
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret) return { error: reply({ error: "Server Supabase environment is incomplete" }, 503) } as const;
  const userClient = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) return { error: reply({ error: "Session could not be verified" }, 401) } as const;
  if (claimsFrom(token)?.aal !== "aal2") return { error: reply({ error: "A verified AAL2 session is required" }, 403) } as const;
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: ceo, error: ceoError } = await admin.from("ceo_admins").select("user_id,enabled").eq("user_id", data.user.id).eq("enabled", true).maybeSingle();
  if (ceoError) return { error: reply({ error: "CEO authorization check failed" }, 500) } as const;
  if (!ceo) return { error: reply({ error: "CEO administrator authorization required" }, 403) } as const;
  return { user: data.user, admin } as const;
}

async function graphToken() {
  const tenant = Deno.env.get("MICROSOFT_TENANT_ID");
  const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
  const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
  if (!tenant || !clientId || !clientSecret) return { error: "Microsoft Graph credentials are not configured in Supabase Function Secrets." };
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, scope: "https://graph.microsoft.com/.default", grant_type: "client_credentials" });
  const response = await fetch(`https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) return { error: "Microsoft identity token request failed.", detail: data.error_description || data.error || `HTTP ${response.status}` };
  return { token: data.access_token as string };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply({ error: "POST required" }, 405);
  const ctx = await authContext(req);
  if ("error" in ctx) return ctx.error;
  const sender = Deno.env.get("MICROSOFT_SENDER_EMAIL");
  if (!sender) return reply({ error: "MICROSOFT_SENDER_EMAIL is not configured. No email was sent." }, 503);

  let body: { outbox_id?: string; confirm_send?: boolean };
  try { body = await req.json(); } catch { return reply({ error: "Valid JSON body required" }, 400); }
  if (!body.outbox_id || body.confirm_send !== true) return reply({ error: "Provide outbox_id and explicit confirm_send=true." }, 400);

  const { data: draft, error: draftError } = await ctx.admin.from("admin_email_outbox").select("id,recipient_email,recipient_user_id,category,subject,body_text,status").eq("id", body.outbox_id).maybeSingle();
  if (draftError) return reply({ error: "Could not load email draft" }, 500);
  if (!draft) return reply({ error: "Draft not found" }, 404);
  if (draft.status !== "draft") return reply({ error: "Only a draft can be sent; this record is not a draft." }, 409);

  let recipient: { id: string; email: string; email_confirmed_at?: string | null } | null = null;
  for (let page = 1; page <= 10; page++) {
    const { data: users, error } = await ctx.admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return reply({ error: "Could not verify registered recipient" }, 500);
    const match = users.users.find((u) => (u.email || "").toLowerCase() === draft.recipient_email.toLowerCase());
    if (match) { recipient = { id: match.id, email: match.email || "", email_confirmed_at: match.email_confirmed_at }; break; }
    if (users.users.length < 1000) break;
  }
  if (!recipient || !recipient.email_confirmed_at) return reply({ error: "Recipient must be a registered user with a confirmed email address." }, 422);

  const graph = await graphToken();
  if ("error" in graph) return reply({ error: graph.error, detail: "No email was sent." }, 503);

  const { data: claimed, error: claimError } = await ctx.admin.from("admin_email_outbox").update({ status: "sending", recipient_user_id: recipient.id, approved_by: ctx.user.id, queued_at: new Date().toISOString(), provider_error: null }).eq("id", draft.id).eq("status", "draft").select("id").maybeSingle();
  if (claimError) return reply({ error: "Could not claim draft for sending" }, 500);
  if (!claimed) return reply({ error: "Draft was already claimed or changed; no email sent." }, 409);

  let response: Response;
  try {
    response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
      method: "POST",
      headers: { Authorization: `Bearer ${graph.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: { subject: draft.subject, body: { contentType: "Text", content: draft.body_text }, toRecipients: [{ emailAddress: { address: recipient.email } }] }, saveToSentItems: true })
    });
  } catch {
    await ctx.admin.from("admin_email_outbox").update({ status: "failed", provider_error: "Network error while sending; provider acceptance is uncertain. Do not retry automatically." }).eq("id", draft.id).eq("status", "sending");
    return reply({ error: "Network error during delivery. Outcome may be uncertain; inspect the Microsoft 365 Sent Items folder before any manual retry." }, 502);
  }

  if (!response.ok) {
    const providerText = (await response.text()).slice(0, 1500);
    await ctx.admin.from("admin_email_outbox").update({ status: "failed", provider_error: `Microsoft Graph HTTP ${response.status}: ${providerText}` }).eq("id", draft.id).eq("status", "sending");
    return reply({ error: "Microsoft Graph rejected the email.", provider_status: response.status }, 502);
  }

  const sentAt = new Date().toISOString();
  const { error: updateError } = await ctx.admin.from("admin_email_outbox").update({ status: "sent", sent_at: sentAt, provider_error: null }).eq("id", draft.id).eq("status", "sending");
  const { error: auditError } = await ctx.admin.from("audit_logs").insert({ actor_user_id: ctx.user.id, action: "admin_email_sent", entity_type: "admin_email_outbox", entity_id: draft.id, request_id: req.headers.get("x-request-id"), metadata: { category: draft.category, recipient_user_id: recipient.id, graph_accepted: true, sent_at: sentAt } });
  return reply({ ok: !updateError, graph_accepted: true, delivery_status: "accepted_by_microsoft_graph", database_updated: !updateError, audit_recorded: !auditError, note: "Graph accepted the send request; this does not prove the recipient's inbox delivery." }, updateError ? 500 : 200);
});
