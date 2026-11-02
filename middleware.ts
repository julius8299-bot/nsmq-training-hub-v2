import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const publicPaths = ["/", "/gallery", "/login", "/accept-invite"];
  if (!publicPaths.includes(request.nextUrl.pathname) && !request.cookies.has("nsmq_session")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nsmq-pathname", request.nextUrl.pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand/|gallery/).*)", "/gallery"] };
