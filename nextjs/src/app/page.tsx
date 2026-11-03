import AdminSessionGate from "./components/admin-session-gate";
import DashboardApp from "./dashboard-app";
import { requireCEO } from "../lib/supabase-server";
import ReadOnlyVerifiedData from "./components/read-only-verified-data";

export const dynamic = "force-dynamic";
export default async function AdminHomePage() {
  const { supabase } = await requireCEO();
  const [{ data: control, error: controlError }, { data: plans, error: plansError }, { data: deposits, error: depositsError }, { data: withdrawals, error: withdrawalsError }] = await Promise.all([
    supabase.from("platform_control").select("financial_operations_enabled, updated_at").eq("id", 1).maybeSingle(),
    supabase.from("investment_plans").select("id, name, asset_code, risk_level, is_active, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("deposit_requests").select("id, amount, currency_code, asset_code, status, created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("withdrawal_requests").select("id, amount, currency_code, asset_code, status, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  return <AdminSessionGate><ReadOnlyVerifiedData control={controlError ? null : control} plans={plansError ? null : plans} deposits={depositsError ? null : deposits} withdrawals={withdrawalsError ? null : withdrawals} /><DashboardApp activeSection="overview" /></AdminSessionGate>;
}
