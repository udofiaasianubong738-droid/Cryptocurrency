import DashboardApp from "./dashboard-app";
import { requireCeoAdmin } from "../lib/supabase/require-ceo";

export const metadata = {
  title: "CEO Admin Dashboard",
  description: "CryptoInvest administration dashboard. Financial operations remain disabled until backend and security checks are complete.",
  robots: { index: false, follow: false },
};

export default async function AdminLandingPage() {
  await requireCeoAdmin();
  return <DashboardApp activeSection="overview" basePath="/admin" />;
}
