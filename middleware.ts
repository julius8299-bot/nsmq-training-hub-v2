import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/gallery", "/login", "/accept-invite", "/setup", "/icon"];

function securityHeaders(response: NextResponse) {
  const development = process.env.NODE_ENV !== "production";
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", [
    "default-src 'self'",
    // Next.js inlines its bootstrap script; eval is needed only by the development server.
    `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${development ? " ws:" : ""}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; "));
  if (!development) response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return response;
}

export function middleware(request: NextRequest) {
  if (!PUBLIC_PATHS.includes(request.nextUrl.pathname) && !request.cookies.has("nsmq_session")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return securityHeaders(NextResponse.redirect(login));
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nsmq-pathname", request.nextUrl.pathname);
  return securityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
}
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|brand/|gallery/).*)", "/gallery"] };
