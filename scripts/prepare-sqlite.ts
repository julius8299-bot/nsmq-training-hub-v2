import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

function databaseUrlFromEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return undefined;

  const match = readFileSync(envPath, "utf8").match(
    /^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?\s*$/m,
  );
  return match?.[1];
}

const databaseUrl = process.env.DATABASE_URL ?? databaseUrlFromEnvFile();

if (!databaseUrl?.startsWith("file:")) {
  process.exit(0);
}

const configuredPath = databaseUrl.slice("file:".length);
const databasePath = isAbsolute(configuredPath)
  ? configuredPath
  : resolve(process.cwd(), "prisma", configuredPath);

mkdirSync(dirname(databasePath), { recursive: true });

if (!existsSync(databasePath)) {
  closeSync(openSync(databasePath, "w"));
  console.log(`Created SQLite database file at ${databasePath}`);
}
