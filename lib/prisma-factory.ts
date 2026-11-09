import { PrismaClient } from "@prisma/client";
import type { PrismaLibSQL } from "@prisma/adapter-libsql";
import type { PrismaPg } from "@prisma/adapter-pg";
import { isPostgresUrl, resolveDatabaseUrl } from "./prisma-url";

export { isPostgresUrl, resolveDatabaseUrl };

// Each driver is loaded only when its database is used. The SQLite driver locates a native binary at
// load time, so importing it on the PostgreSQL host (Vercel) would be unnecessary and fragile.
/* eslint-disable @typescript-eslint/no-require-imports */
const loadLibSQL = () => (require("@prisma/adapter-libsql") as { PrismaLibSQL: typeof PrismaLibSQL }).PrismaLibSQL;
const loadPg = () => (require("@prisma/adapter-pg") as { PrismaPg: typeof PrismaPg }).PrismaPg;
/* eslint-enable @typescript-eslint/no-require-imports */

/** Builds a client for SQLite (file:) or PostgreSQL URLs; scripts and the app share this. */
export function createPrismaClient(url?: string) {
  const resolved = resolveDatabaseUrl(url);
  const adapter = isPostgresUrl(resolved) ? postgresAdapter(resolved) : new (loadLibSQL())({ url: resolved });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Neon/Vercel URLs carry Prisma-only parameters (pgbouncer, schema, connect_timeout) that node-postgres must not receive. */
function postgresAdapter(url: string) {
  const parsed = new URL(url);
  const schema = parsed.searchParams.get("schema") ?? undefined;
  const timeout = Number(parsed.searchParams.get("connect_timeout") || 15);
  for (const key of ["pgbouncer", "schema", "connect_timeout", "connection_limit", "pool_timeout"]) parsed.searchParams.delete(key);
  const Pg = loadPg();
  return new Pg(
    { connectionString: parsed.toString(), max: Number(process.env.DATABASE_POOL_SIZE || 5), connectionTimeoutMillis: timeout * 1000 },
    schema ? { schema } : undefined,
  );
}

/** Case-insensitive "contains" that behaves the same on SQLite (LIKE) and PostgreSQL (ILIKE). */
export function containsText(value: string) {
  const postgres = isPostgresUrl(resolveDatabaseUrl());
  return (postgres ? { contains: value, mode: "insensitive" } : { contains: value }) as { contains: string };
}
