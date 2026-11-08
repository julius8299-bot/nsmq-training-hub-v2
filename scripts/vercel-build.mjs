// Hosted build (Vercel runs "npm run vercel-build"). Steps, in order:
//   1. generate the PostgreSQL client   2. create/update tables (additive only; refuses anything destructive)
//   3. roles   4. load the 4,226-question bank   5. load element drills   6. build the site
// Re-running is safe: steps 2–5 skip anything that already exists.
import { spawnSync } from "node:child_process";

const env = { ...process.env };
// Accept the variable names from both the Neon and the older Vercel Postgres integrations.
env.POSTGRES_PRISMA_URL ||= env.POSTGRES_URL || env.DATABASE_URL;
env.POSTGRES_URL_NON_POOLING ||= env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL || env.DATABASE_URL;
if (!env.POSTGRES_PRISMA_URL?.startsWith("postgres") || !env.POSTGRES_URL_NON_POOLING?.startsWith("postgres")) {
  console.error("\nNo PostgreSQL database is connected to this Vercel project.\n" +
    "In Vercel: Project → Storage → Create/Connect Database → Neon, then redeploy.\n" +
    "(Expected POSTGRES_PRISMA_URL and POSTGRES_URL_NON_POOLING, or DATABASE_URL and DATABASE_URL_UNPOOLED.)\n");
  process.exit(1);
}

const steps = [
  ["Generating database client", "prisma", ["generate", "--schema", "prisma/postgresql/schema.prisma"]],
  ["Updating database tables", "prisma", ["db", "push", "--schema", "prisma/postgresql/schema.prisma", "--skip-generate"]],
  ["Preparing roles", "tsx", ["scripts/ensure-database.ts"]],
  ["Loading the training bank", "tsx", ["scripts/import-catalog.ts"]],
  ["Loading element drills", "tsx", ["scripts/import-elements.ts"]],
  ["Building the website", "next", ["build"]],
];
for (const [label, command, args] of steps) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync("npx", ["--no-install", command, ...args], { stdio: "inherit", env, shell: process.platform === "win32" });
  if (result.status !== 0) { console.error(`\n✖ ${label} failed.`); process.exit(result.status ?? 1); }
}
