import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithSessionCookies(url: URL, source: NextResponse) {
  const response = NextResponse.redirect(url);
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  for (const name of ["Cache-Control", "Expires", "Pragma"]) {
    const value = source.headers.get(name);
    if (value) response.headers.set(name, value);
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { error: "Secure admin access is not configured." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => {
          response.headers.set(name, value);
        });
      },
    },
  });

  // Validate the session with the Auth server, not getSession() or browser state.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", request.nextUrl.pathname);
    return redirectWithSessionCookies(login, response);
  }

  // CEO access is an explicit database authorization, not a user-editable JWT
  // user_metadata claim. The table's RLS policy permits a CEO to read only
  // their own enabled authorization row.
  const { data: ceo, error: ceoError } = await supabase
    .from("ceo_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("enabled", true)
    .maybeSingle();

  if (ceoError || !ceo) {
    return NextResponse.json(
      { error: "This account is not authorized for CEO administration." },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError || assurance?.currentLevel !== "aal2") {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("mfa", "required");
    return redirectWithSessionCookies(login, response);
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Protect the admin landing page and every top-level admin section too.
  // Only the sign-in and explicitly non-production preview routes are public.
  matcher: [
    "/((?!login|preview|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
