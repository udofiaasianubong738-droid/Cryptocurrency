import { notFound } from "next/navigation";
import DashboardApp from "../../../dashboard-app";

const sections = new Set([
  "customers", "deposits", "withdrawals", "plans", "orders", "portfolio",
  "reports", "ledger", "reconciliation", "audit", "integrations", "security",
  "settings", "system-status",
]);

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) return { title: "Not found" };
  const label = section.replace(/-/g, " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase());
  return { title: `${label} · Admin Preview`, robots: { index: false, follow: false } };
}

export default async function AdminPreviewSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  return <DashboardApp activeSection={section} basePath="/preview/admin" previewMode />;
}
