import type { Metadata, Viewport } from "next";
import "./globals.css";

const permanentAppUrl = "https://cryptoinvest.com";

export const metadata: Metadata = {
  metadataBase: new URL(permanentAppUrl),
  title: { default: "CryptoInvest Customer", template: "%s | CryptoInvest" },
  description: "CryptoInvest customer portal. Access your own account and investment information securely.",
  applicationName: "CryptoInvest",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/customer" },
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    title: "CryptoInvest",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#071638",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
