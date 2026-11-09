import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// A mechanical projection keeps both provider schemas identical apart from the datasource.
// Hosted builds generate the client from this file; the app passes the pooled URL to the driver adapter at runtime.
const source = readFileSync(resolve("prisma/schema.prisma"), "utf8");
const target = source
  .replace('provider = "sqlite"', 'provider = "postgresql"')
  .replace('url      = env("DATABASE_URL")', 'url      = env("POSTGRES_URL_NON_POOLING")');
mkdirSync(resolve("prisma/postgresql"), { recursive: true });
writeFileSync(resolve("prisma/postgresql/schema.prisma"), target);
console.log("PostgreSQL schema prepared. No database was contacted.");
