import type { Metadata } from "next";

const previewUrl = "https://cryptocurrency-customer-preview.admin-cryptoinvest.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(previewUrl),
  title: "CryptoInvest Customer Portal Preview",
  description:
    "Preview of the CryptoInvest customer portal interface. Account data is unavailable until secure customer sign-in and verified backend data are connected.",
  applicationName: "CryptoInvest",
  alternates: {
    canonical: "/customer/preview",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function CustomerPreviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
