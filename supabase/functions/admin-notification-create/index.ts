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

  let input: { user_id?: string; category?: string; title?: string; body?: string };
  try { input = await req.json(); } catch { return reply({ error: "Valid JSON body required" }, 400); }
  const allowedCategories = new Set(["general","account","security","market","investment","support"]);
  if (!input.user_id || !input.title?.trim() || !input.body?.trim() || !input.category || !allowedCategories.has(input.category)) return reply({ error: "user_id, valid category, title and body are required" }, 400);
  if (input.title.trim().length > 160 || input.body.trim().length > 4000) return reply({ error: "Notification title/body exceeds allowed length" }, 400);
  const { data: target, error: targetError } = await admin.auth.admin.getUserById(input.user_id);
  if (targetError || !target.user) return reply({ error: "Target user does not exist" }, 404);

  const { data: notification, error: insertError } = await admin.from("user_notifications").insert({
    user_id: input.user_id, category: input.category, title: input.title.trim(), body: input.body.trim(),
    metadata: { created_by_admin: userData.user.id, delivery_channel: "in_app" }
  }).select("id,user_id,category,title,created_at").single();
  if (insertError) return reply({ error: "Could not create in-app notification", detail: insertError.message }, 500);

  const { error: auditError } = await admin.from("audit_logs").insert({
    actor_user_id: userData.user.id, action: "admin_user_notification_created", entity_type: "user_notifications",
    entity_id: notification.id, request_id: req.headers.get("x-request-id"),
    metadata: { target_user_id: input.user_id, category: input.category, channel: "in_app" }
  });
  return reply({ ok: true, notification, audit_recorded: !auditError, audit_warning: auditError?.message, note: "This creates an in-app notification only; it does not send email or move funds." });
});