import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
 return {
  id: "/customer/preview",
  name: "CryptoInvest",
  short_name: "CryptoInvest",
  description: "More than investing. Built on trust.",
  start_url: "/customer/preview",
  scope: "/",
  display: "standalone",
  display_override: ["standalone", "minimal-ui"],
  orientation: "portrait-primary",
  background_color: "#050505",
  theme_color: "#080808",
  categories: ["finance", "business"],
  icons: [
   {src:"/cryptoinvest-mark.svg",sizes:"any",type:"image/svg+xml",purpose:"any"},
   {src:"/cryptoinvest-mark.svg",sizes:"any",type:"image/svg+xml",purpose:"maskable"}
  ]
 };
}
