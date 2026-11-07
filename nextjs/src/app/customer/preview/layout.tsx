import type { Metadata, Viewport } from "next";
import RegisterCustomerServiceWorker from "./register-sw";

export const metadata: Metadata = {
  title: { default: "CryptoInvest", template: "%s | CryptoInvest" },
  description: "CryptoInvest customer portal. More than investing. Built on trust.",
  applicationName: "CryptoInvest",
  manifest: "/customer/preview/manifest.webmanifest",
  icons: {
    icon: [{ url: "/cryptoinvest-mark.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/cryptoinvest-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/cryptoinvest-mark.svg", type: "image/svg+xml" }]
  },
  appleWebApp: { capable: true, title: "CryptoInvest", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false }
};
export const viewport: Viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};
export default function CustomerPreviewLayout({children}:{children:React.ReactNode}) {
  return <><RegisterCustomerServiceWorker />{children}</>;
}
