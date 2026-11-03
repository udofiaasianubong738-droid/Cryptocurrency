import DashboardApp from "./dashboard-app";

export const metadata = {
  title: "CEO Admin Dashboard",
  description: "CryptoInvest administration dashboard. Financial operations remain disabled until backend and security checks are complete.",
  robots: { index: false, follow: false },
};

export default function AdminLandingPage() {
  return <DashboardApp activeSection="overview" basePath="/admin" />;
}
