import { notFound, redirect } from "next/navigation";
import DashboardApp from "../dashboard-app";
import { getCeoSession } from "@/lib/supabase/server";

const availableSections = new Set(["overview","customers","deposits","withdrawals","plans","portfolio","orders","reports","ledger","reconciliation","audit","integrations","security","customer-portal"]);

export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!availableSections.has(section)) notFound();

  const access = await getCeoSession(true);
  if (!access.user || !access.authorized) redirect("/login?reason=not-authorized");
  if (!access.aal2) redirect("/security/mfa");

  return <DashboardApp activeSection={section} />;
}
