import { isAbsolute, resolve } from "node:path";

/**
 * One connection string decides the driver:
 * - Hosted (Vercel + Neon): POSTGRES_PRISMA_URL is the pooled PostgreSQL URL the Neon integration creates.
 * - Local: DATABASE_URL="file:./dev.db" keeps using the existing SQLite file in prisma/.
 */
export function resolveDatabaseUrl(url = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  if (!url) throw new Error("No database is configured. Set DATABASE_URL (local) or POSTGRES_PRISMA_URL (hosted).");
  if (!url.startsWith("file:")) return url;
  // Prisma historically resolved relative SQLite paths from the prisma/ folder; keep pointing at the same file.
  const path = url.slice("file:".length);
  return "file:" + (isAbsolute(path) ? path : resolve(process.cwd(), "prisma", path)).replaceAll("\\", "/");
}

export function isPostgresUrl(url: string) {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}
