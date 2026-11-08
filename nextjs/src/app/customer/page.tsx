import CustomerPortal from "./customer-portal";

export const metadata = {
  title: "Customer Home",
  description: "Your private CryptoInvest customer account.",
  robots: { index: false, follow: false },
};

export default function CustomerHomePage() {
  return <CustomerPortal activeSection="home" />;
}
