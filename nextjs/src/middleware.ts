import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // The shared preview Worker serves two separate surfaces:
  // customer-preview hosts open the customer welcome page; admin hosts go
  // through the protected CEO route. Never expose the admin dashboard at "/".
  if (pathname === "/") {
    const destination = request.nextUrl.clone();
    destination.pathname = request.nextUrl.hostname.toLowerCase().startsWith("cryptocurrency-customer-preview.")
      ? "/customer/welcome"
      : "/admin";
    return NextResponse.redirect(destination);
  }

  const isCustomerPath = pathname === "/customer" || pathname.startsWith("/customer/");
  const isCustomerPublicPath = pathname === "/customer/login" || pathname === "/customer/register" || pathname === "/customer/welcome" || pathname === "/customer/preview";
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
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
  matcher: ["/", "/admin/:path*", "/dashboard/:path*", "/customer/:path*"],
};
