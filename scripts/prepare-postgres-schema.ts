import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// A mechanical projection keeps both provider schemas consistent during the transition.
const source = readFileSync(resolve("prisma/schema.prisma"), "utf8");
const target = source
  .replace('provider = "sqlite"', 'provider = "postgresql"')
  .replace('env("DATABASE_URL")', 'env("POSTGRES_DATABASE_URL")')
  .replace('provider = "prisma-client-js"', 'provider = "prisma-client-js"\n  output = "./generated"');
mkdirSync(resolve("prisma/postgresql"), { recursive: true });
writeFileSync(resolve("prisma/postgresql/schema.prisma"), target);
console.log("PostgreSQL schema prepared. No database was contacted.");
