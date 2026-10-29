import { redirect } from "next/navigation";
import DashboardApp from "./dashboard-app";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  let supabase;
  try { supabase = await createClient(); }
  catch { redirect("/login?reason=configuration"); }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: ceo, error: roleError } = await supabase
    .from("ceo_admins").select("enabled").eq("user_id", user.id).eq("enabled", true).maybeSingle();
  if (roleError || !ceo?.enabled) redirect("/login?reason=unauthorized");
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") redirect("/login?reason=mfa");
  return <DashboardApp activeSection="overview" />;
}
