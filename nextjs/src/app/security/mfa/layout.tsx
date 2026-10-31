import { redirect } from "next/navigation";
import { getCeoSession } from "@/lib/supabase/server";

export default async function MfaLayout({ children }: { children: React.ReactNode }) {
  const access = await getCeoSession(false);
  if (!access.user) redirect("/login");
  if (!access.authorized) redirect("/login?reason=not-authorized");
  return children;
}
