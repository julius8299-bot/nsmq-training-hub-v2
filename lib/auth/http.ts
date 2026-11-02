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

export function assertSameOrigin(request: NextRequest) {
  const configured = process.env.APP_URL;
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new AccessError(503, "Application origin is not configured.");
  }
  const expected = new URL(configured ?? request.url).origin;
  if (request.headers.get("origin") !== expected) throw new AccessError(403, "Invalid request origin.");
  if (request.method !== "DELETE" && !request.headers.get("content-type")?.startsWith("application/json")) {
    throw new AccessError(415, "JSON content is required.");
  }
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

export function errorResponse(error: unknown) {
  if (error instanceof PasswordCapacityError) {
    return NextResponse.json({ error: "Sign-in is busy. Please try again shortly." }, { status: 503, headers: { "Retry-After": "2" } });
  }
  if (error instanceof AccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError || error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid request data." }, { status: 400 });
  }
  console.error("Request failed", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ error: "The request could not be completed." }, { status: 500 });
}
