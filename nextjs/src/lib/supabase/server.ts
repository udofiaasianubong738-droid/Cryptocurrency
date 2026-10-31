import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Middleware refreshes sessions.
        }
      },
    },
  });
}

export async function getCeoSession(requireAal2 = false) {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { supabase, user: null, authorized: false, aal2: false };
  }

  const { data: ceo, error: ceoError } = await supabase
    .from("ceo_admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (ceoError || !ceo) {
    return { supabase, user: userData.user, authorized: false, aal2: false };
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const aal2 = !assuranceError && assurance.currentLevel === "aal2" && assurance.nextLevel === "aal2";

  return {
    supabase,
    user: userData.user,
    authorized: true,
    aal2,
    blockedByAal: requireAal2 && !aal2,
  };
}
