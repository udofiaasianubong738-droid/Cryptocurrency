import { redirect } from "next/navigation";

export const metadata = {
  title: "CryptoInvest Admin",
  description: "Secure CryptoInvest administration sign-in.",
  robots: { index: false, follow: false },
};

export default function AdminLandingPage() {
  redirect("/login");
}
