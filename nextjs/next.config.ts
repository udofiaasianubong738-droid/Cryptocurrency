import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // This isolated build is the customer-facing Worker, not the CEO admin app.
  env: {
    NEXT_PUBLIC_APP_ROLE: "customer",
  },
};

export default nextConfig;
