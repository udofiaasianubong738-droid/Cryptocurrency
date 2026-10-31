import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedSections = new Set([
  "overview",
  "customers",
  "deposits",
  "withdrawals",
  "plans",
  "portfolio",
  "orders",
  "reports",
  "ledger",
  "reconciliation",
  "audit",
  "integrations",
  "security",
  "customer-portal",
]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const section = pathname.split("/")[1] ?? "";
  const isMfaSetup = pathname === "/security/mfa";
  const isDashboard = protectedSections.has(section);

  if (!isMfaSetup && !isDashboard) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
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
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    const destination = new URL("/login", request.url);
    destination.searchParams.set("next", pathname);
    return NextResponse.redirect(destination);
  }

  const { data: ceo, error: ceoError } = await supabase
    .from("ceo_admins")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (ceoError || !ceo) {
    return NextResponse.redirect(new URL("/login?reason=not-authorized", request.url));
  }

  if (isDashboard) {
    const { data: assurance, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError || assurance.currentLevel !== "aal2") {
      const destination = new URL("/security/mfa", request.url);
      destination.searchParams.set("next", pathname);
      return NextResponse.redirect(destination);
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
