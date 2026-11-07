import { notFound } from "next/navigation";
import CustomerPortal from "../customer-portal";

const sections = new Set([
  "profile", "plans", "investments", "deposit", "withdrawals", "performance",
  "transactions", "notifications", "documents", "support", "security",
]);

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = section.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return { title: `${title} | CryptoInvest Customer`, robots: { index: false, follow: false } };
}

export default async function CustomerSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.has(section)) notFound();
  return <CustomerPortal activeSection={section} />;
}
