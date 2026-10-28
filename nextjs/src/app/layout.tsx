import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./admin-entry.css";

export const metadata: Metadata = {
  title: { default: "CryptoInvest | Workspace", template: "%s | CryptoInvest" },
  description: "CryptoInvest workspace. Admin access is protected and financial operations remain disabled.",
  applicationName: "CryptoInvest",
  robots: { index: false, follow: false },
  icons: { icon: "/icon.svg", shortcut: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6fa" },
    { media: "(prefers-color-scheme: dark)", color: "#151e2a" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
