import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const PROJECT_REF = "yniphceoofuwzpelpksd";
const CEO_EMAIL = "cyrrenza@outlook.com";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || new URL(url).hostname !== `${PROJECT_REF}.supabase.co`) throw new Error("Approved Supabase project configuration is missing or invalid.");
  return { url, key };
}

export async function createSupabaseServerClient() {
  const { url, key } = config();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookieOptions: { name: "cryptoinvest-auth", sameSite: "lax", secure: url.startsWith("https://"), path: "/" },
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options); } catch { /* Middleware refresh handles read-only Server Component contexts. */ }
      },
    },
  });
}

export async function requireCEO() {
  const { redirect } = await import("next/navigation");
  let supabase;
  try { supabase = await createSupabaseServerClient(); } catch { redirect("/login?reason=config"); }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user || user.email?.toLowerCase() !== CEO_EMAIL) redirect("/login");
  const { data: admin, error: adminError } = await supabase.from("ceo_admins").select("user_id").eq("user_id", user.id).eq("enabled", true).maybeSingle();
  if (adminError || !admin) redirect("/login?reason=unauthorized");
  const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalError || aal?.currentLevel !== "aal2") redirect("/login?reason=mfa");
  return { supabase, user };
}
