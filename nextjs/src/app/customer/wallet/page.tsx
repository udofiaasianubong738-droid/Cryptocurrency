import CustomerPortal from "../customer-portal";

export const metadata = {
  title: "Wallet",
  description: "Your private CryptoInvest wallet overview and read-only account records.",
  robots: { index: false, follow: false },
};

export default function CustomerWalletPage() {
  return <CustomerPortal activeSection="wallet" />;
}
