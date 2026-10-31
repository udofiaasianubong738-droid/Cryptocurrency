import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedSections = new Set([
  "overview", "customers", "deposits", "withdrawals", "plans", "portfolio",
  "orders", "reports", "ledger", "reconciliation", "audit", "integrations",
  "security", "customer-portal",
]);

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
  return to;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const section = pathname.split("/")[1] ?? "";
  const isMfaSetup = pathname === "/security/mfa";
  const isDashboard = !isMfaSetup && protectedSections.has(section);
  const isAdminApi = pathname.startsWith("/api/admin/");
  if (!isMfaSetup && !isDashboard && !isAdminApi) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (isAdminApi) return NextResponse.json({ error: "Server authentication is not configured." }, { status: 503 });
    return NextResponse.redirect(new URL("/login?reason=configuration", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    if (isAdminApi) return copyCookies(response, NextResponse.json({ error: "Authentication required." }, { status: 401 }));
    const destination = new URL("/login", request.url);
    destination.searchParams.set("next", pathname);
    return copyCookies(response, NextResponse.redirect(destination));
  }

  const { data: ceo, error: ceoError } = await supabase
    .from("ceo_admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (ceoError || !ceo) {
    if (isAdminApi) return copyCookies(response, NextResponse.json({ error: "CEO authorization required." }, { status: 403 }));
    return copyCookies(response, NextResponse.redirect(new URL("/login?reason=not-authorized", request.url)));
  }

  if (isDashboard || isAdminApi) {
    const { data: assurance, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance.currentLevel !== "aal2" || assurance.nextLevel !== "aal2") {
      if (isAdminApi) return copyCookies(response, NextResponse.json({ error: "AAL2 verification required." }, { status: 403 }));
      const destination = new URL("/security/mfa", request.url);
      destination.searchParams.set("next", pathname);
      return copyCookies(response, NextResponse.redirect(destination));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
