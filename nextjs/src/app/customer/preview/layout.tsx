import type { Metadata } from "next";

const previewUrl = "https://cryptocurrency-customer-preview.udofiaasianubong738.workers.dev";

export const metadata: Metadata = {
  metadataBase: new URL(previewUrl),
  title: "CryptoInvest Customer Portal Preview",
  description:
    "CryptoInvest customer portal with live market readings and historical price charts. Private customer account information remains unavailable until secure sign-in.",
  applicationName: "CryptoInvest",
  manifest: "/customer-preview-manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icon-192.png", type: "image/png", sizes: "192x192" }]
  },
  appleWebApp: {
    capable: true,
    title: "CryptoInvest",
    statusBarStyle: "black-translucent"
  },
  alternates: { canonical: "/customer/preview" },
  robots: { index: false, follow: false }
};

export default function CustomerPreviewLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
