import { getSupabaseServerClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedActions = new Set([
  "dashboard",
  "create_demo_account",
  "create_demo_investment",
  "record_demo_outcome",
  "execute_demo_order",
]);

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Expected a JSON request body." }, 400);
  }

  if (typeof body.action !== "string" || !allowedActions.has(body.action)) {
    return json({ error: "Unsupported admin action." }, 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return json({ error: "Supabase is not configured on the server." }, 503);
  }

  let supabase;
  try {
    supabase = await getSupabaseServerClient();
  } catch {
    return json({ error: "Supabase authentication is not configured." }, 503);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: "Sign-in is required." }, 401);

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    return json({ error: "CEO MFA (AAL2) is required for admin access." }, 403);
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) return json({ error: "Your session has expired. Sign in again." }, 401);

  let upstream: Response;
  try {
    upstream = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/admin-demo-control`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return json({ error: "The protected admin backend could not be reached." }, 502);
  }

  const text = await upstream.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { error: "The admin backend returned an invalid response." };
  }
  return json(payload, upstream.status);
}
