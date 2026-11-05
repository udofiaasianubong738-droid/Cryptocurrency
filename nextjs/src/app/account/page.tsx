import AccountPortal from "../account-portal";

export const metadata = {
  title: "Customer Account",
  description: "Private CryptoInvest customer account and read-only portfolio records.",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountPortal />;
}
