import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { createPrismaClient } from "../lib/prisma-factory";
import { ensureRoles, login } from "../lib/auth/service";
import { hashPassword } from "../lib/auth/crypto";
import { galleryItems } from "../lib/gallery-data";
import { ROUND_TYPES } from "../lib/constants";

const port = 3143;
const base = "http://127.0.0.1:" + port;
const production = process.env.NSMQ_TEST_SERVER === "production";
const savedNextFiles = ["next-env.d.ts", "tsconfig.json"].map((file) => ({ file, content: readFileSync(file, "utf8") }));
mkdirSync("work", { recursive: true });
const folder = mkdtempSync(resolve("work", "routes-test-"));
copyFileSync(resolve(process.env.NSMQ_TEST_DATABASE_PATH ?? "prisma/dev.db"), resolve(folder, "test.db"));
const databaseUrl = "file:" + resolve(folder, "test.db").replaceAll("\\", "/");
const db = createPrismaClient(databaseUrl);
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
  const env: NodeJS.ProcessEnv = { ...process.env, DATABASE_URL: databaseUrl, APP_URL: base, NODE_ENV: production ? "production" : "development", NSMQ_TEST_DIST: production ? (process.env.NSMQ_TEST_DIST ?? ".next") : "work/next-http-test" };
  server = spawn(process.execPath, [process.env.npm_execpath!, "run", production ? "start" : "dev", "--", "-p", String(port), "--hostname", "127.0.0.1"], {
    cwd: process.cwd(), env, windowsHide: true, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
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
  for (const path of ["/", "/gallery", "/login", "/accept-invite", "/setup"]) {
    assert.equal((await get(path)).status, 200, path);
    console.log("PASS public " + path);
  }
  const home = await (await get("/")).text();
  assert.match(home, /Ghanata SHS/);
  assert.match(home, /ghanata-shs-logo\.jpg/);
  for (const path of ["/brand/nsmq-logo.png", "/brand/ghanata-shs-logo.jpg", "/icon", "/gallery/NSMQ-trophy.jpg", ...galleryItems.map((item) => item.src)]) {
    assert.ok(path.startsWith("/"));
    const response = await get(path);
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type") ?? "", /^image\//, path);
    console.log("PASS branding/gallery image " + path);
  }
  const headers = (await get("/")).headers;
  assert.match(headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/);
  assert.equal(headers.get("x-frame-options"), "DENY");
  if (production) assert.match(headers.get("strict-transport-security") ?? "", /max-age=/);
  console.log("PASS security headers");
  for (const path of ["/dashboard", "/practice", "/elements", "/full-contest", "/contest", "/speed-race", "/potd", "/problem-of-the-day", "/tf", "/true-false", "/riddles", "/question-bank", "/admin"]) {
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
  for (const roundType of ROUND_TYPES) {
    const response = await get("/api/questions?page=1&roundType=" + roundType, studentToken);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.ok(data.total > 0, roundType);
    assert.ok(data.questions.every((question: { roundType: string }) => question.roundType === roundType));
    console.log("PASS round filter " + roundType + ": " + data.total);
  }
  // A full round trip over HTTP: random set without answers, server draw, scored attempt with feedback.
  const post = (path: string, token: string, body: unknown) => fetch(base + path, {
    method: "POST", headers: { origin: base, "Content-Type": "application/json", cookie: "nsmq_session=" + token }, body: JSON.stringify(body),
  });
  for (const roundType of ROUND_TYPES) {
    const set = await (await get("/api/training/questions?limit=5&roundType=" + roundType, studentToken)).json();
    assert.ok(set.questions.length > 0, "training set " + roundType);
    assert.ok(set.questions.every((question: Record<string, unknown>) => !("answer" in question) && !("riddleClues" in question)));
    const draw = await (await post("/api/training/draws", studentToken, { questionId: set.questions[0].id, mode: "SELF_PRACTICE" })).json();
    assert.ok(draw.drawId && !("answer" in draw.question));
    const attempt = await post("/api/attempts", studentToken, { drawId: draw.drawId, userAnswer: "my answer" });
    assert.equal(attempt.status, 200);
    assert.ok((await attempt.json()).feedback.answer);
    console.log("PASS hidden-answer training round trip " + roundType);
  }
  const potd = await (await get("/api/potd", studentToken)).json();
  assert.ok(potd.problem && !("answer" in potd.problem));
  assert.equal((await (await get("/api/potd", studentToken)).json()).problem.id, potd.problem.id, "Same problem all day");
  assert.equal((await get("/api/dashboard", studentToken)).status, 200);
  assert.equal((await get("/api/admin/students", studentToken)).status, 403);
  assert.equal((await get("/api/admin/students", staffToken)).status, 200);
  assert.equal((await get("/api/admin/questions?status=queue", staffToken)).status, 200);
  console.log("PASS POTD, dashboard and coach endpoints");
  const response = await fetch(base + "/api/auth/login", {
    method: "POST", headers: { origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ email: student.email, password }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i);
  if (production) assert.match(cookie, /; Secure/i);
  console.log("PASS HTTP sign-in and cookie contract");
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await db.$disconnect();
  if (server?.pid) {
    if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    else {
      const stopped = new Promise<void>((done) => {
        if (server?.exitCode !== null || server?.signalCode !== null) done();
        else server?.once("exit", () => done());
      });
      try { process.kill(-server.pid, "SIGTERM"); } catch { /* The owned process group already exited. */ }
      await Promise.race([stopped, delay(2000)]);
      try { process.kill(-server.pid, "SIGKILL"); } catch { /* No children remain. */ }
    }
  }
  for (const file of savedNextFiles) writeFileSync(file.file, file.content);
  process.exit(process.exitCode ?? 0);
});
