import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, closeSync, openSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { acceptInvitation, createInvitation, ensureRoles, login, resolveSession } from "../lib/auth/service";
import { hashPassword, hashToken, verifyPassword, PasswordCapacityError } from "../lib/auth/crypto";
import { can, canInvite } from "../lib/auth/policy";
import { importSeedQuestions } from "../lib/questions/seed-import";
import { seedDatabase } from "../prisma/seed";
import type { SeedQuestion } from "../prisma/seed-data/question-factory";

mkdirSync("work", { recursive: true });
const testDirectory = mkdtempSync(resolve("work", "foundation-test-"));
closeSync(openSync(resolve(testDirectory, "test.db"), "w"));
process.env.DATABASE_URL = "file:" + resolve(testDirectory, "test.db").replaceAll("\\", "/");
process.env.APP_URL = "http://localhost:3000";
const push = spawnSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "db", "push", "--skip-generate"], {
  env: process.env, encoding: "utf8", windowsHide: true,
});
assert.equal(push.status, 0, push.stderr);
const db = new PrismaClient();
const password = "Team training test passphrase 2026";
let passed = 0;
async function test(name: string, run: () => Promise<void> | void) {
  await run(); passed += 1; console.log("PASS " + name);
}

async function main() {
  await ensureRoles(db);
  const admin = await db.user.create({ data: {
    name: "Test Admin", email: "admin@example.test", role: "ADMIN", roleId: "ADMIN",
    status: "ACTIVE", passwordHash: await hashPassword(password),
  } });
  const invite = await createInvitation(db, { email: "Student@Example.Test", role: "STUDENT", actorId: admin.id });
  const student = await acceptInvitation(db, {
    email: "student@example.test", token: invite.token, name: "Test Student", password,
  });
  const signedIn = await login(db, student.email, password);
  await test("email-bound one-use invitations; no replay or arbitrary registration", async () => {
    assert.equal(student.roleId, "STUDENT");
    await assert.rejects(() => acceptInvitation(db, { email: student.email, token: invite.token, name: "Replay", password }));
    const wrong = await createInvitation(db, { email: "expected@example.test", role: "STUDENT", actorId: admin.id });
    await assert.rejects(() => acceptInvitation(db, { email: "wrong@example.test", token: wrong.token, name: "Wrong", password }));
    await db.invitation.update({ where: { id: wrong.invitation.id }, data: { expiresAt: new Date(0) } });
    await assert.rejects(() => acceptInvitation(db, { email: "expected@example.test", token: wrong.token, name: "Expired", password }));
    await assert.rejects(() => login(db, "uninvited@example.test", password));
    const revoked = await createInvitation(db, { email: "revoked@example.test", role: "STUDENT", actorId: admin.id });
    await db.invitation.update({ where: { id: revoked.invitation.id }, data: { revokedAt: new Date() } });
    await assert.rejects(() => acceptInvitation(db, { email: "revoked@example.test", token: revoked.token, name: "Revoked", password }));
  });
  await test("hash-only session and password storage", async () => {
    assert.equal(await verifyPassword(password, student.passwordHash), true);
    assert.equal(await verifyPassword("incorrect password", student.passwordHash), false);
    assert.notEqual(await hashPassword(password), student.passwordHash);
    const session = await db.authSession.findUniqueOrThrow({ where: { tokenHash: hashToken(signedIn.token) } });
    assert.notEqual(session.tokenHash, signedIn.token);
    assert.equal((await resolveSession(db, signedIn.token)).id, student.id);
  });
  await test("password hashing has bounded memory/concurrency and overload fails closed", async () => {
    const results = await Promise.allSettled(Array.from({ length: 8 }, () => hashPassword(password)));
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 5);
    const rejected = results.filter((result) => result.status === "rejected");
    assert.equal(rejected.length, 3);
    assert.ok(rejected.every((result) => result.reason instanceof PasswordCapacityError));
    const { errorResponse } = await import("../lib/auth/http");
    const response = errorResponse(new PasswordCapacityError());
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "2");
    assert.equal(await verifyPassword(password, student.passwordHash), true);
  });
  await test("four-role permission boundaries and staff invitation limits", async () => {
    assert.equal(can("STUDENT", "questions:write"), false);
    assert.equal(can("QUIZMASTER", "contest:host"), true);
    assert.equal(can("QUIZMASTER", "questions:write"), false);
    assert.equal(canInvite("COACH", "ADMIN"), false);
    await assert.rejects(() => createInvitation(db, { email: "escape@example.test", role: "ADMIN", actorId: student.id }));
    const coach = await db.user.create({ data: { name: "Coach", email: "coach@example.test", role: "COACH", roleId: "COACH", status: "ACTIVE" } });
    await assert.rejects(() => createInvitation(db, { email: "escape@example.test", role: "QUIZMASTER", actorId: coach.id }));
  });
  await test("invitations cannot outlive the issuer's permission to grant that role", async () => {
    const issuer = await db.user.create({ data: { name: "Former coach", email: "former-coach@example.test", role: "COACH", roleId: "COACH", status: "ACTIVE" } });
    const disabled = await createInvitation(db, { email: "disabled-issuer@example.test", role: "STUDENT", actorId: issuer.id });
    await db.user.update({ where: { id: issuer.id }, data: { status: "DISABLED" } });
    await assert.rejects(() => acceptInvitation(db, { email: disabled.invitation.email, token: disabled.token, name: "Blocked", password }));
    await db.user.update({ where: { id: issuer.id }, data: { status: "ACTIVE" } });
    const downgraded = await createInvitation(db, { email: "downgraded-issuer@example.test", role: "STUDENT", actorId: issuer.id });
    await db.user.update({ where: { id: issuer.id }, data: { role: "STUDENT", roleId: "STUDENT" } });
    await assert.rejects(() => acceptInvitation(db, { email: downgraded.invitation.email, token: downgraded.token, name: "Blocked", password }));
    assert.equal(await db.user.count({ where: { email: { in: [disabled.invitation.email, downgraded.invitation.email] } } }), 0);
  });
  const adminSession = await login(db, admin.email, password);
  const request = (url: string, token?: string, method = "GET", body?: unknown, origin = process.env.APP_URL) =>
    new NextRequest("http://localhost:3000" + url, {
      method, headers: {
        ...(token && { cookie: "nsmq_session=" + token }),
        ...(method !== "GET" && { origin: origin!, "Content-Type": "application/json" }),
      }, ...(body !== undefined && { body: JSON.stringify(body) }),
    });
  const questionsApi = await import("../app/api/questions/route");
  const attemptsApi = await import("../app/api/attempts/route");
  const dashboardApi = await import("../app/api/dashboard/route");
  const itemApi = await import("../app/api/questions/[id]/route");
  const reviewApi = await import("../app/api/questions/[id]/review/route");
  const logoutApi = await import("../app/api/auth/logout/route");
  const input = {
    subject: "PHYSICS", topic: "Electricity", subtopic: "Electron", roundType: "RIDDLE",
    difficulty: "HARD", timeLimitSeconds: 60, questionText: "Who am I?", answer: "electron",
    acceptedAnswers: ["an electron"], shortcutSolution: "Identify negative charge.", fullSolution: "An electron has a negative elementary charge.",
    commonTrap: "Confusing proton and electron.", encouragement: "Keep practising.",
    repeatedPattern: "particle identification", patternFamily: "atomic structure", sourceType: "ORIGINAL",
    permissionStatus: "ORIGINAL", tags: ["riddle", "ghana-context"], isGhanaContext: true,
    riddleClues: [1, 2, 3, 4].map((n) => ({ clueNumber: n, clueText: "Particle clue number " + n, points: 99 })),
  };
  let questionId = "";
  await test("anonymous denial, private bypass denial, CSRF and mass-assignment protection", async () => {
    assert.equal((await questionsApi.GET(request("/api/questions"))).status, 401);
    assert.equal((await questionsApi.GET(request("/api/questions?includePrivate=true", signedIn.token))).status, 403);
    assert.equal((await questionsApi.POST(request("/api/questions", signedIn.token, "POST", input))).status, 403);
    assert.equal((await questionsApi.POST(request("/api/questions", adminSession.token, "POST", input, "https://evil.test"))).status, 403);
    const created = await questionsApi.POST(request("/api/questions", adminSession.token, "POST", { ...input, reviewStatus: "APPROVED", isPrivateOnly: false, id: "spoofed", revision: 999 }));
    assert.equal(created.status, 201);
    const result = await created.json();
    questionId = result.id;
    assert.notEqual(questionId, "spoofed");
    assert.equal(result.reviewStatus, "PENDING_REVIEW");
    assert.equal(result.isPrivateOnly, true);
    assert.equal(result.revision, 1);
    assert.deepEqual(result.riddleClues.map((c: { points: number }) => c.points), [5, 4, 3, 3]);
    assert.equal((await (await questionsApi.GET(request("/api/questions", signedIn.token))).json()).length, 0);
  });
  await test("human approval unlocks original questions; Ghana filters and clues retain API shape", async () => {
    assert.equal((await reviewApi.POST(request("/review", signedIn.token, "POST", { decision: "APPROVED", notes: "Attempted student review", revision: 1 }), { params: Promise.resolve({ id: questionId }) })).status, 403);
    assert.equal((await reviewApi.POST(request("/review", adminSession.token, "POST", { decision: "APPROVED", notes: "Answer and all clues checked.", revision: 1 }), { params: Promise.resolve({ id: questionId }) })).status, 200);
    const response = await questionsApi.GET(request("/api/questions?page=1&roundType=RIDDLE&isGhanaContext=true", signedIn.token));
    const data = await response.json();
    assert.equal(data.total, 1);
    assert.equal(data.questions[0].riddleClues.length, 4);
    const imported = await questionsApi.POST(request("/api/questions", adminSession.token, "POST", {
      ...input, sourceType: "PAST_QUESTION", permissionStatus: "LICENSED", isPastQuestion: true,
    }));
    assert.equal(imported.status, 201);
    const importedId = (await imported.json()).id;
    assert.equal((await reviewApi.POST(request("/review", adminSession.token, "POST", {
      decision: "APPROVED", notes: "Cannot skip source evidence.", revision: 1,
    }), { params: Promise.resolve({ id: importedId }) })).status, 400);
  });
  await test("approval is bound to the reviewed question revision", async () => {
    const created = await questionsApi.POST(request("/api/questions", adminSession.token, "POST", input));
    const draft = await created.json();
    const context = { params: Promise.resolve({ id: draft.id }) };
    const edited = await itemApi.PUT(request("/edit", adminSession.token, "PUT", { ...input, questionText: "Who am I? Revised draft." }), context);
    assert.equal(edited.status, 200);
    assert.equal((await edited.json()).revision, 2);
    const review = { decision: "APPROVED", notes: "Reviewed the displayed draft carefully.", revision: 1 };
    assert.equal((await reviewApi.POST(request("/review", adminSession.token, "POST", review), context)).status, 409);
    assert.equal((await db.question.findUniqueOrThrow({ where: { id: draft.id } })).isPrivateOnly, true);
    assert.equal((await reviewApi.POST(request("/review", adminSession.token, "POST", { ...review, revision: 2 }), context)).status, 200);
    assert.equal((await db.questionReview.findFirstOrThrow({ where: { questionId: draft.id } })).questionRevision, 2);
  });
  await test("attempts use the session owner; per-student dashboard and server scoring", async () => {
    const response = await attemptsApi.POST(request("/api/attempts", signedIn.token, "POST", {
      questionId, userAnswer: "  Electron ", mode: "RIDDLE", riddleClueNumber: 4,
      userId: admin.id, riddlePoints: 999, timeTakenSeconds: 10,
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).pointsAwarded, 3);
    assert.equal(await db.attempt.count({ where: { userId: student.id } }), 1);
    assert.equal(await db.attempt.count({ where: { userId: admin.id } }), 0);
    const stats = await (await dashboardApi.GET(request("/api/dashboard", signedIn.token))).json();
    const adminStats = await (await dashboardApi.GET(request("/api/dashboard", adminSession.token))).json();
    assert.equal(stats.attempts, 1); assert.equal(adminStats.attempts, 0);
  });
  await test("archive and repeated seed preserve student records and attempts", async () => {
    const before = await db.attempt.findFirstOrThrow();
    assert.equal((await itemApi.DELETE(request("/api/questions/" + questionId, adminSession.token, "DELETE"), { params: Promise.resolve({ id: questionId }) })).status, 200);
    assert.equal(await db.attempt.count({ where: { id: before.id } }), 1);
    assert.ok((await db.question.findUniqueOrThrow({ where: { id: questionId } })).archivedAt);
    const users = await db.user.count();
    await seedDatabase(db); await seedDatabase(db);
    assert.equal(await db.user.count(), users);
    assert.equal(await db.attempt.count({ where: { id: before.id } }), 1);
    const sample = { ...input, sourceType: "ORIGINAL", permissionStatus: "ORIGINAL", ghanaContext: true, isGhanaContext: true, isPastQuestion: false, isPrivateOnly: false, answer: "unique import answer", tags: [] } as SeedQuestion;
    assert.equal((await importSeedQuestions(db, [sample])).inserted, 1);
    assert.equal((await importSeedQuestions(db, [sample])).inserted, 0);
    assert.equal(await db.attempt.count({ where: { id: before.id } }), 1);
  });
  await test("disabled, expired and revoked sessions fail closed", async () => {
    await db.user.update({ where: { id: student.id }, data: { status: "DISABLED" } });
    await assert.rejects(() => resolveSession(db, signedIn.token));
    await db.user.update({ where: { id: student.id }, data: { status: "ACTIVE" } });
    await db.authSession.update({ where: { tokenHash: hashToken(signedIn.token) }, data: { expiresAt: new Date(0) } });
    await assert.rejects(() => resolveSession(db, signedIn.token));
    assert.equal((await logoutApi.POST(request("/api/auth/logout", adminSession.token, "POST", {}))).status, 200);
    await assert.rejects(() => resolveSession(db, adminSession.token));
  });
  await test("login throttling is database-backed", async () => {
    const key = hashToken("login:student@example.test");
    await db.authThrottle.upsert({ where: { key }, update: { count: 10 }, create: { key, count: 10, windowEndsAt: new Date(Date.now() + 60_000) } });
    await assert.rejects(() => login(db, student.email, password), (error: unknown) => (error as { status: number }).status === 429);
  });
  await test("another account cannot cause a persistent team-wide login lockout", async () => {
    await db.authThrottle.upsert({
      where: { key: hashToken("login:global") },
      create: { key: hashToken("login:global"), count: 999, windowEndsAt: new Date(Date.now() + 60_000) },
      update: { count: 999 },
    });
    const session = await login(db, admin.email, password);
    assert.equal((await resolveSession(db, session.token)).id, admin.id);
  });
  console.log(passed + " foundation scenarios passed against a disposable database.");
  const { prisma } = await import("../lib/prisma");
  await prisma.$disconnect();
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
