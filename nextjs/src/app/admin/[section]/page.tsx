import { notFound } from "next/navigation";
import DashboardApp from "../../dashboard-app";

const sections = new Set([
  "customers",
  "investment-records",
  "performance",
  "ai-operations",
  "customer-details",
  "customer-verification",
  "plan-details",
  "investment-history",
  "report-history",
  "data-quality",
  "review-queue",
  "platform-activity",
  "security",
  "mfa",
  "sessions",
  "audit",
  "system-status",
  "backend-config",
  "settings",
  "notifications",
  "help",
  "system-info",
]);

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const label = section.replace(/-/g, " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase());
  return { title: label, description: `CryptoInvest CEO admin workspace: ${label}.` };
}

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  return <DashboardApp activeSection={section} />;
}
