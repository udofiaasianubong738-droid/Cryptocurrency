import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const requestHeaders = await headers();
  const hostname = (requestHeaders.get("host") ?? "").toLowerCase();
  const isCustomerApp =
    hostname.startsWith("cryptocurrency.") ||
    hostname.startsWith("cryptocurrency-customer-preview.") ||
    hostname.includes("customer");

  const startUrl = isCustomerApp ? "/customer/welcome" : "/admin";
  const appName = isCustomerApp ? "CryptoInvest Customer" : "CryptoInvest CEO Admin";

  return {
    id: isCustomerApp ? "/customer" : "/admin",
    name: appName,
    short_name: "CryptoInvest",
    description: isCustomerApp
      ? "Your secure CryptoInvest customer portal."
      : "CryptoInvest CEO administration workspace.",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#071638",
    theme_color: "#071638",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/pwa-icon/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }
    ]
  };
}
