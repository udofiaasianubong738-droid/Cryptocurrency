import DashboardApp from "../../dashboard-app";

export const metadata = {
  title: "Admin Design Preview",
  description: "Read-only CryptoInvest admin interface preview. Contains no live customer or financial records.",
  robots: { index: false, follow: false },
};

export default function AdminPreviewPage() {
  return <DashboardApp activeSection="overview" basePath="/preview/admin" previewMode />;
}
