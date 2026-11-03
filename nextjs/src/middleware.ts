import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROJECT_REF = "yniphceoofuwzpelpksd";
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || new URL(url).hostname !== `${PROJECT_REF}.supabase.co`) {
    if (request.nextUrl.pathname === "/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/login?reason=config", request.url));
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookieOptions: { name: "cryptoinvest-auth", sameSite: "lax", secure: url.startsWith("https://"), path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const path = request.nextUrl.pathname;
  if (path === "/login" || path.startsWith("/_next/") || path === "/favicon.ico") {
    await supabase.auth.getUser();
    return response;
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.redirect(new URL("/login", request.url));
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
