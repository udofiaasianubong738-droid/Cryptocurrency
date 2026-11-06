import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./server";

export async function requireCeoAdmin() {
  const supabase = await createSupabaseServerClient();

  // getUser() verifies the session with Supabase Auth; never trust browser
  // state or user-editable user_metadata for authorization.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: ceo, error: ceoError } = await supabase
    .from("ceo_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (ceoError || !ceo) {
    redirect("/login?unauthorized=1");
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError || assurance?.currentLevel !== "aal2") {
    redirect("/login?mfa=required");
  }

  return user;
}
