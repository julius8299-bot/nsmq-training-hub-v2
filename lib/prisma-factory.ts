import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaPg } from "@prisma/adapter-pg";
import { isPostgresUrl, resolveDatabaseUrl } from "./prisma-url";

export { isPostgresUrl, resolveDatabaseUrl };

/** Builds a client for SQLite (file:) or PostgreSQL URLs; scripts and the app share this. */
export function createPrismaClient(url?: string) {
  const resolved = resolveDatabaseUrl(url);
  const adapter = isPostgresUrl(resolved)
    ? new PrismaPg({ connectionString: resolved, max: Number(process.env.DATABASE_POOL_SIZE || 5) })
    : new PrismaLibSQL({ url: resolved });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** Case-insensitive "contains" that behaves the same on SQLite (LIKE) and PostgreSQL (ILIKE). */
export function containsText(value: string) {
  const postgres = isPostgresUrl(resolveDatabaseUrl());
  return (postgres ? { contains: value, mode: "insensitive" } : { contains: value }) as { contains: string };
}
