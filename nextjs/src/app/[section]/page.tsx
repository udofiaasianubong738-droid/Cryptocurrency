import { notFound, redirect } from "next/navigation";

const availableSections = new Set([
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
]);

export default async function LegacySectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!availableSections.has(section)) notFound();

  // Legacy first-level routes previously rendered the admin shell without
  // matching the /admin middleware route. Send them to the protected
  // administrator namespace instead.
  redirect(`/admin/${section}`);
}
