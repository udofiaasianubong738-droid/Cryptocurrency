import DashboardApp from "../dashboard-app";
import { requireCeoAdmin } from "../../lib/supabase/require-ceo";

export const metadata = {
  title: "CEO Admin Workspace",
  description: "Protected CryptoInvest CEO administration workspace.",
};

export default async function AdminHomePage() {
  await requireCeoAdmin();
  return <DashboardApp activeSection="overview" />;
}
