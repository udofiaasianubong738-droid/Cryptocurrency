import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";

let browserClient: SupabaseClient | undefined;
const EXPECTED_PROJECT_REF = "yniphceoofuwzpelpksd";

export function createSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured. Set the public project URL and publishable/anon key in the Cloudflare Worker environment.");
  let host: string;
  try { host = new URL(url).hostname; } catch { throw new Error("Supabase URL is invalid."); }
  if (host !== `${EXPECTED_PROJECT_REF}.supabase.co`) throw new Error("Supabase URL does not match the approved CryptoInvest project. Login is blocked.");
  browserClient = createBrowserClient(url, key, { cookieOptions: { name: "cryptoinvest-auth", sameSite: "lax", secure: url.startsWith("https://"), path: "/" } });
  return browserClient;
}
