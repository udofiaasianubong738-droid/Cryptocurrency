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
  const appName = isCustomerApp ? "CryptoInvest" : "CryptoInvest Admin";

  return {
    id: isCustomerApp ? "/customer/welcome" : "/admin",
    name: appName,
    short_name: "CryptoInvest",
    description: isCustomerApp
      ? "Your secure CryptoInvest customer portal."
      : "CryptoInvest CEO administration workspace.",
    start_url: startUrl,
    scope: isCustomerApp ? "/customer/" : "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#071638",
    theme_color: "#071638",
    categories: ["business", "finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
    ]
  };
}
