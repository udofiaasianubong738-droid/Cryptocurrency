import DashboardApp from "../dashboard-app";

export const metadata = {
  title: "CEO Admin Workspace",
  description: "Protected CryptoInvest CEO administration workspace.",
};

export default function AdminHomePage() {
  return <DashboardApp activeSection="overview" />;
}
