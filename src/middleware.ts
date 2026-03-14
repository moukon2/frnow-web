import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSessionToken(request: NextRequest): string | null {
  return (
    request.cookies.get("session")?.value ||
    request.cookies.get("auth_token")?.value ||
    null
  );
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;

  // www → frnow.io
  if (host === "www.frnow.io") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = "frnow.io";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // dev bypass
  const devBypass = process.env.DEV_AUTH_BYPASS === "1";

  // login page skip
  if (pathname === "/login") {
    return NextResponse.next();
  }

  const session = getSessionToken(request);

  // members pages
  if (pathname.startsWith("/app")) {
    if (!session && !devBypass) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  // members APIs
  if (
    pathname.startsWith("/api/pro-") ||
    pathname.startsWith("/api/pro/")
  ) {
    if (!session && !devBypass) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};