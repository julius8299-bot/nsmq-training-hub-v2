import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { AccessError, resolveSession, SESSION_SECONDS } from "./service";
import type { Permission } from "./policy";
import { PasswordCapacityError } from "./crypto";

export const SESSION_COOKIE = "nsmq_session";

export async function readJsonRequest(request: NextRequest, maxBytes = 256 * 1024) {
  const reader = request.body?.getReader();
  if (!reader) throw new AccessError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > maxBytes) {
        await reader.cancel();
        throw new AccessError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
}

/** Origins allowed to make state-changing requests: APP_URL plus the URLs Vercel assigns to this deployment. */
export function allowedOrigins(request: NextRequest) {
  const origins = new Set<string>();
  const add = (value?: string) => {
    if (!value) return;
    try { origins.add(new URL(value.includes("://") ? value : "https://" + value).origin); } catch { /* Ignore malformed values. */ }
  };
  add(process.env.APP_URL);
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  add(process.env.VERCEL_BRANCH_URL);
  add(process.env.VERCEL_URL);
  if (!origins.size) {
    if (process.env.NODE_ENV === "production") throw new AccessError(503, "Application origin is not configured.");
    add(request.url);
  }
  return origins;
}

export function assertSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins(request).has(origin)) throw new AccessError(403, "Invalid request origin.");
  if (request.method !== "DELETE" && !request.headers.get("content-type")?.startsWith("application/json")) {
    throw new AccessError(415, "JSON content is required.");
  }
}

/** The visitor's network address as reported by the hosting edge (used only to scope sign-in failure counters). */
export function clientNetwork(request: NextRequest) {
  const forwarded = request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0];
  return forwarded?.trim().slice(0, 64) || undefined;
}

export function publicBaseUrl(request: NextRequest) {
  const configured = process.env.APP_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL && "https://" + process.env.VERCEL_PROJECT_PRODUCTION_URL);
  return configured || request.nextUrl.origin;
}

export async function requireApiUser(request: NextRequest, permission: Permission = "train") {
  if (!["GET", "HEAD"].includes(request.method)) assertSameOrigin(request);
  return resolveSession(prisma, request.cookies.get(SESSION_COOKIE)?.value, permission);
}

export async function pageUser(permission: Permission = "train") {
  return resolveSession(prisma, (await cookies()).get(SESSION_COOKIE)?.value, permission);
}

export function setSessionCookie(response: NextResponse, token: string, maxAge = SESSION_SECONDS) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/** Query-string numbers: a malformed value is a 400, never a server error. */
export function intParam(request: NextRequest, name: string, fallback: number, min: number, max: number) {
  const raw = request.nextUrl.searchParams.get(name);
  if (raw === null || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) throw new AccessError(400, `Invalid ${name}.`);
  return value;
}

export function errorResponse(error: unknown) {
  if (error instanceof PasswordCapacityError) {
    return NextResponse.json({ error: "Sign-in is busy. Please try again shortly." }, { status: 503, headers: { "Retry-After": "2" } });
  }
  if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join(".");
    return NextResponse.json({ error: issue ? (field ? field + ": " : "") + issue.message : "Invalid request data." }, { status: 400 });
  }
  if (error instanceof SyntaxError) return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  // Prisma "record not found" (e.g. editing a question that does not exist) is a 404, not a crash.
  if (typeof error === "object" && error && (error as { code?: string }).code === "P2025") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  // Log enough to diagnose (name, Prisma/driver code, message) without request bodies or secrets.
  const detail = error instanceof Error
    ? { name: error.name, code: (error as { code?: string }).code, message: error.message.slice(0, 500),
        cause: (error as { cause?: { message?: string } }).cause?.message?.slice(0, 300) }
    : { name: "UnknownError" };
  console.error("Request failed", JSON.stringify(detail));
  return NextResponse.json({ error: "The request could not be completed." }, { status: 500 });
}
