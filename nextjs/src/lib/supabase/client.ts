import { createBrowserClient } from "@supabase/ssr";

// These are Supabase's public project URL and publishable key. They are intended
// for browser use; never place a service_role/secret key in this module.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yniphceoofuwzpelpksd.supabase.co";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_IiY4eMNa-IPD3u-7D5FrTg_C7jT02Kd";

export function createClient() {
  return createBrowserClient(url, key);
}
