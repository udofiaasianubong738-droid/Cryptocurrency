import { redirect } from "next/navigation";

export const metadata = {
  title: "CryptoInvest Administration",
  description: "Protected CryptoInvest CEO administration workspace.",
  robots: { index: false, follow: false },
};

export default function RootPage() {
  // Route all entry through /admin, which is protected by middleware.
  redirect("/admin");
}
