import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CryptoInvest | Portfolio Overview",
  description: "CryptoInvest dashboard foundation. Financial operations are disabled.",
  applicationName: "CryptoInvest",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b5cff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
