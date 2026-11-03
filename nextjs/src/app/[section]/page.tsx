import { notFound } from "next/navigation";
import DashboardApp from "../dashboard-app";
import AdminSessionGate from "../components/admin-session-gate";
import { requireCEO } from "../../lib/supabase-server";

export const dynamic = "force-dynamic";
const availableSections = new Set(["customers","deposits","withdrawals","plans","portfolio","orders","reports","ledger","reconciliation","audit","integrations","security","customer-portal"]);
export default async function SectionPage({params}:{params:Promise<{section:string}>}) {
 const {section}=await params;
 if(!availableSections.has(section)) notFound();
 await requireCEO();
 return <AdminSessionGate><DashboardApp activeSection={section}/></AdminSessionGate>;
}
