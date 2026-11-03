import { notFound } from "next/navigation";
import DashboardApp from "../dashboard-app";
import AdminSessionGate from "../components/admin-session-gate";

const availableSections = new Set(["customers","deposits","withdrawals","plans","portfolio","orders","reports","ledger","reconciliation","audit","integrations","security","customer-portal"]);
export default async function SectionPage({params}:{params:Promise<{section:string}>}){
 const {section}=await params;
 if(!availableSections.has(section)) notFound();
 return <AdminSessionGate><DashboardApp activeSection={section}/></AdminSessionGate>;
}
