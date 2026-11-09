import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const configuredSurface = process.env.CRYPTOINVEST_APP_SURFACE;
  const hostname = request.nextUrl.hostname.toLowerCase();
  const isCustomerHost = hostname === "cryptoinvest.com" ||
    hostname === "www.cryptoinvest.com" ||
    hostname === "cryptocurrency.udofiaasianubong738.workers.dev" ||
    hostname.startsWith("cryptocurrency-customer-preview.");
  const surface = configuredSurface === "customer" || configuredSurface === "admin"
    ? configuredSurface
    : isCustomerHost ? "customer" : "admin";

  const isCustomerPath = pathname === "/customer" || pathname.startsWith("/customer/");
  const isCustomerPublicPath = pathname === "/customer/login" ||
    pathname === "/customer/register" ||
    pathname === "/customer/welcome" ||
    pathname === "/customer/preview";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAdminLoginPath = pathname === "/login";

  // Each Worker serves exactly one application surface. A URL on the other
  // Worker cannot expose the other app, even if its route exists in the
  // shared source tree.
  if (surface === "customer" && (isAdminPath || isAdminLoginPath)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  if (surface === "admin" && isCustomerPath) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (pathname === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = surface === "customer" ? "/customer/welcome" : "/admin";
    return NextResponse.redirect(destination);
  }

  const protectedPath = isAdminPath || (isCustomerPath && !isCustomerPublicPath);
  if (!protectedPath) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: "Secure access is not configured." }, { status: 503 });
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
  if (userError || !user) {
    const login = request.nextUrl.clone();
    login.pathname = isCustomerPath ? "/customer/login" : "/login";
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (isAdminPath) {
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
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/admin/:path*", "/dashboard/:path*", "/customer/:path*"],
};
