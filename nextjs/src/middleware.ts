import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const adminProtected = pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const accountPath = pathname === "/account" || pathname.startsWith("/account/");
  if (!adminProtected && !accountPath) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Secure application access is not configured." }, { status: 503 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  const isAccountLogin = pathname === "/account/login";

  if (accountPath) {
    if (userError || !user) {
      if (isAccountLogin) return response;
      const login = request.nextUrl.clone();
      login.pathname = "/account/login";
      return NextResponse.redirect(login);
    }

    // A CEO identity must never use the customer portal: CEO RLS policies
    // intentionally grant broader read access than customer-owned policies.
    const { data: ceo, error: ceoError } = await supabase
      .from("ceo_admins")
      .select("user_id,enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (ceoError) {
      return NextResponse.json({ error: "Customer role could not be verified. Access is blocked." }, { status: 503 });
    }
    if (ceo) {
      if (!ceo.enabled) {
        return NextResponse.json({ error: "This CEO identity is disabled and cannot access the customer portal." }, { status: 403 });
      }
      const admin = request.nextUrl.clone();
      admin.pathname = "/admin";
      admin.search = "";
      return NextResponse.redirect(admin);
    }
    if (isAccountLogin) {
      const account = request.nextUrl.clone();
      account.pathname = "/account";
      account.search = "";
      return NextResponse.redirect(account);
    }
    return response;
  }

  if (userError || !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  const { data: ceo, error: ceoError } = await supabase
    .from("ceo_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (ceoError || !ceo) {
    return NextResponse.json({ error: "This account is not authorized for CEO administration." }, { status: 403 });
  }

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("mfa", "required");
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/account/:path*"],
};
