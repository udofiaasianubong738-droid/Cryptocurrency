import type { Metadata, Viewport } from "next";
import PwaRegister from "./pwa-register";
import "./globals.css";

const appSurface = process.env.CRYPTOINVEST_APP_SURFACE === "customer" ? "customer" : "admin";
const manifestPath = appSurface === "customer" ? "/manifest-customer.webmanifest" : "/manifest-admin.webmanifest";

export const metadata: Metadata = {
  title: { default: "CryptoInvest", template: "%s | CryptoInvest" },
  description: "CryptoInvest — More than investing. Built on trust. Secure customer access and CEO administration.",
  applicationName: "CryptoInvest",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
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
  return <html lang="en"><head><link rel="manifest" href={manifestPath} /></head><body><PwaRegister />{children}</body></html>;
}
