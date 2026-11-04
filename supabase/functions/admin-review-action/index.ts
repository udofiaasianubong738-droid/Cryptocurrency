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

  let input: { entity_type?: string; entity_id?: string; status?: string; note?: string };
  try { input = await req.json(); } catch { return reply({ error: "Valid JSON body required" }, 400); }
  if (!input.entity_type || !input.entity_id || !input.status) return reply({ error: "entity_type, entity_id and status are required" }, 400);
  if ((input.note || "").length > 2000) return reply({ error: "Review note is too long" }, 400);

  let result: unknown;
  let action: string;
  if (input.entity_type === "finding") {
    if (!["triaged","resolved","dismissed"].includes(input.status)) return reply({ error: "Invalid finding review status" }, 400);
    if (input.status === "resolved" && !input.note?.trim()) return reply({ error: "A resolution note is required" }, 400);
    const values: Record<string, unknown> = { status: input.status, reviewed_by: userData.user.id, reviewed_at: new Date().toISOString(), resolution_note: input.note?.trim() || null };
    const { data, error } = await admin.from("admin_ai_findings").update(values).eq("id", input.entity_id).select("id,status,reviewed_by,reviewed_at").maybeSingle();
    if (error) return reply({ error: "Finding review update failed", detail: error.message }, 500);
    if (!data) return reply({ error: "Finding not found" }, 404);
    result = data; action = "admin_ai_finding_reviewed";
  } else if (input.entity_type === "support_ticket") {
    if (!["open","in_progress","waiting_for_user","closed"].includes(input.status)) return reply({ error: "Invalid support ticket status" }, 400);
    const now = new Date().toISOString();
    const values: Record<string, unknown> = { status: input.status, admin_notes: input.note?.trim() || null, reviewed_by: userData.user.id, reviewed_at: now };
    if (input.status === "closed") values.closed_at = now;
    const { data, error } = await admin.from("support_tickets").update(values).eq("id", input.entity_id).select("id,status,reviewed_by,reviewed_at,closed_at").maybeSingle();
    if (error) return reply({ error: "Support ticket update failed", detail: error.message }, 500);
    if (!data) return reply({ error: "Support ticket not found" }, 404);
    result = data; action = "admin_support_ticket_reviewed";
  } else {
    return reply({ error: "Unsupported review entity" }, 400);
  }

  const { error: auditError } = await admin.from("audit_logs").insert({ actor_user_id: userData.user.id, action, entity_type: input.entity_type, entity_id: input.entity_id, request_id: req.headers.get("x-request-id"), metadata: { status: input.status, note_present: Boolean(input.note?.trim()) } });
  return reply({ ok: true, result, audit_recorded: !auditError, audit_warning: auditError?.message });
});