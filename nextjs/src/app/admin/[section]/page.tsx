import { notFound } from "next/navigation";
import DashboardApp from "../../dashboard-app";

const sections = new Set([
  "customers",
  "deposits",
  "withdrawals",
  "plans",
  "portfolio",
  "orders",
  "reports",
  "ledger",
  "reconciliation",
  "audit",
  "integrations",
  "security",
  "settings",
  "system-status",
  "ai-operations",
  "communications",
  "compliance-audit",
  "system-testing",
]);

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const label = section.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { title: label, description: `CryptoInvest admin workspace: ${label}.` };
}

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  return <DashboardApp activeSection={section} />;
}
