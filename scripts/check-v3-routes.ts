import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { ensureRoles, login } from "../lib/auth/service";
import { hashPassword } from "../lib/auth/crypto";

const port = 3143;
const base = "http://127.0.0.1:" + port;
const savedNextFiles = ["next-env.d.ts", "tsconfig.json"].map((file) => ({ file, content: readFileSync(file, "utf8") }));
mkdirSync("work", { recursive: true });
const folder = mkdtempSync(resolve("work", "routes-test-"));
copyFileSync(resolve("prisma/dev.db"), resolve(folder, "test.db"));
const databaseUrl = "file:" + resolve(folder, "test.db").replaceAll("\\", "/");
const db = new PrismaClient({ datasourceUrl: databaseUrl });
let server: ReturnType<typeof spawn> | undefined;
let logs = "";
const delay = (ms: number) => new Promise((done) => setTimeout(done, ms));
async function main() {
  await ensureRoles(db);
  const password = "HTTP smoke fixture password 2026";
  const staff = await db.user.create({ data: { email: "http-admin@example.test", name: "HTTP Admin", status: "ACTIVE", role: "ADMIN", roleId: "ADMIN", passwordHash: await hashPassword(password) } });
  const student = await db.user.create({ data: { email: "http-student@example.test", name: "HTTP Student", status: "ACTIVE", role: "STUDENT", roleId: "STUDENT", passwordHash: await hashPassword(password) } });
  const staffToken = (await login(db, staff.email, password)).token;
  const studentToken = (await login(db, student.email, password)).token;
  const env = { ...process.env, DATABASE_URL: databaseUrl, APP_URL: base, NSMQ_TEST_DIST: "work/next-http-test" };
  server = spawn(process.execPath, [process.env.npm_execpath!, "run", "dev", "--", "-p", String(port), "--hostname", "127.0.0.1"], {
    cwd: process.cwd(), env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => { logs += chunk.toString(); });
  server.stderr?.on("data", (chunk) => { logs += chunk.toString(); });
  for (let tries = 0; tries < 90; tries += 1) {
    try {
      if ((await fetch(base + "/api/auth/session")).status === 401) break;
    } catch { /* Await the local server. */ }
    if (server.exitCode !== null) throw new Error(logs);
    if (tries === 89) throw new Error("Server startup timed out. " + logs);
    await delay(1000);
  }
  const get = (path: string, token?: string) => fetch(base + path, {
    redirect: "manual", headers: token ? { cookie: "nsmq_session=" + token } : {},
  });
  for (const path of ["/", "/gallery", "/login", "/accept-invite", "/brand/nsmq-logo.png", "/gallery/ghanata-team.jpg"]) {
    assert.equal((await get(path)).status, 200, path);
    console.log("PASS public " + path);
  }
  for (const path of ["/dashboard", "/practice", "/full-contest", "/contest", "/speed-race", "/potd", "/problem-of-the-day", "/tf", "/true-false", "/riddles", "/question-bank", "/admin"]) {
    assert.equal((await get(path)).status, 307, "Missing login redirect: " + path);
    assert.equal((await get(path, staffToken)).status, 200, "Authenticated route: " + path);
    console.log("PASS gated/authenticated " + path);
  }
  assert.equal((await get("/admin", studentToken)).status, 307);
  assert.equal((await get("/api/questions")).status, 401);
  assert.equal((await get("/api/questions?includePrivate=true", studentToken)).status, 403);
  for (const query of ["page=1", "page=1&isGhanaContext=true", "page=1&roundType=RIDDLE&isGhanaContext=true"]) {
    const response = await get("/api/questions?" + query, studentToken);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(data.total > 0); assert.ok(data.questions.length > 0);
    if (query.includes("roundType=RIDDLE")) assert.ok(data.questions[0].riddleClues.length >= 4);
    console.log("PASS bank " + query + ": " + data.total);
  }
  const response = await fetch(base + "/api/auth/login", {
    method: "POST", headers: { origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ email: student.email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i);
  console.log("PASS HTTP sign-in and cookie contract");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await db.$disconnect();
  if (server?.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    else server.kill();
  }
  for (const file of savedNextFiles) writeFileSync(file.file, file.content);
  process.exit(process.exitCode ?? 0);
});
