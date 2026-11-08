import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, closeSync, openSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createPrismaClient } from "../lib/prisma-factory";
import { NextRequest } from "next/server";
import { acceptInvitation, createInvitation, createPasswordReset, ensureRoles, login, resolveSession } from "../lib/auth/service";
import { hashPassword, hashToken, verifyPassword, PasswordCapacityError, MAX_ACTIVE_DERIVATIONS, MAX_QUEUED_DERIVATIONS } from "../lib/auth/crypto";
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
const db = createPrismaClient();
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
    const capacity = MAX_ACTIVE_DERIVATIONS + MAX_QUEUED_DERIVATIONS;
    const results = await Promise.allSettled(Array.from({ length: capacity + 6 }, () => hashPassword(password)));
    assert.equal(results.filter((result) => result.status === "fulfilled").length, capacity);
    const rejected = results.filter((result) => result.status === "rejected");
    assert.equal(rejected.length, 6);
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
  const drawsApi = await import("../app/api/training/draws/route");
  const clueApi = await import("../app/api/training/draws/[id]/clue/route");
  const trainingApi = await import("../app/api/training/questions/route");
  const startDraw = async (token: string, id: string, mode = "RIDDLE", extra: Record<string, unknown> = {}) => {
    const response = await drawsApi.POST(request("/api/training/draws", token, "POST", { questionId: id, mode, ...extra }));
    assert.equal(response.status, 201, await response.clone().text());
    return response.json();
  };
  await test("answers, solutions and unseen clues never reach the student before answering", async () => {
    const list = await (await trainingApi.GET(request("/api/training/questions?roundType=RIDDLE&limit=5", signedIn.token))).json();
    assert.ok(list.questions.length >= 1);
    for (const item of list.questions) {
      for (const field of ["answer", "acceptedAnswers", "fullSolution", "shortcutSolution", "riddleClues"]) assert.ok(!(field in item), field + " leaked");
    }
    const draw = await startDraw(signedIn.token, questionId);
    assert.ok(!("answer" in draw.question));
    assert.equal(draw.clues.length, 1, "Only the first clue is sent");
    const plain = await (await questionsApi.GET(request("/api/questions", signedIn.token))).json();
    assert.ok(plain.every((item: Record<string, unknown>) => !("answer" in item)));
  });
  await test("attempts use the session owner; riddle points, time and double submits are enforced by the server", async () => {
    const draw = await startDraw(signedIn.token, questionId);
    for (let clue = 2; clue <= 4; clue += 1) {
      const revealed = await (await clueApi.POST(request("/clue", signedIn.token, "POST", {}), { params: Promise.resolve({ id: draw.drawId }) })).json();
      assert.equal(revealed.clues.length, clue);
    }
    // Mass assignment and client-chosen scoring are rejected outright.
    const spoofed = await attemptsApi.POST(request("/api/attempts", signedIn.token, "POST", { drawId: draw.drawId, userAnswer: "electron", userId: admin.id, riddleClueNumber: 1, riddlePoints: 999 }));
    assert.equal(spoofed.status, 400);
    const response = await attemptsApi.POST(request("/api/attempts", signedIn.token, "POST", { drawId: draw.drawId, userAnswer: "  Electron " }));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.pointsAwarded, 3, "Answering after the 4th clue is worth 3 points");
    assert.equal(result.feedback.answer, "electron");
    assert.equal((await attemptsApi.POST(request("/api/attempts", signedIn.token, "POST", { drawId: draw.drawId, userAnswer: "electron" }))).status, 409, "No double scoring");
    assert.equal((await attemptsApi.POST(request("/api/attempts", adminSession.token, "POST", { drawId: draw.drawId, userAnswer: "electron" }))).status, 404, "Draws belong to one student");
    assert.equal(await db.attempt.count({ where: { userId: student.id } }), 1);
    assert.equal(await db.attempt.count({ where: { userId: admin.id } }), 0);
    // A late answer is checked but earns nothing; a timeout never earns a penalty.
    const late = await startDraw(signedIn.token, questionId);
    await db.questionDraw.update({ where: { id: late.drawId }, data: { issuedAt: new Date(Date.now() - 10 * 60_000) } });
    const lateResult = await (await attemptsApi.POST(request("/api/attempts", signedIn.token, "POST", { drawId: late.drawId, userAnswer: "electron" }))).json();
    assert.deepEqual([lateResult.isCorrect, lateResult.pointsAwarded, lateResult.late], [true, 0, true]);
    const stats = await (await dashboardApi.GET(request("/api/dashboard", signedIn.token))).json();
    const adminStats = await (await dashboardApi.GET(request("/api/dashboard", adminSession.token))).json();
    assert.equal(stats.attempts, 2); assert.equal(adminStats.attempts, 0);
    assert.equal(stats.dailyStreak, 1);
  });
  await test("coaches cannot approve their own questions; edits to live questions wait in review", async () => {
    const coachA = await db.user.create({ data: { name: "Coach A", email: "coach-a@example.test", role: "COACH", roleId: "COACH", status: "ACTIVE", passwordHash: await hashPassword(password) } });
    const coachB = await db.user.create({ data: { name: "Coach B", email: "coach-b@example.test", role: "COACH", roleId: "COACH", status: "ACTIVE", passwordHash: await hashPassword(password) } });
    const tokenA = (await login(db, coachA.email, password)).token;
    const tokenB = (await login(db, coachB.email, password)).token;
    const draft = await (await questionsApi.POST(request("/api/questions", tokenA, "POST", { ...input, roundType: "ROUND_ONE", riddleClues: [], answer: "proton", questionText: "Which particle has charge +1?" }))).json();
    const context = { params: Promise.resolve({ id: draft.id }) };
    const review = { decision: "APPROVED", notes: "Checked answer and charge sign.", revision: 1 };
    assert.equal((await reviewApi.POST(request("/review", tokenA, "POST", review), context)).status, 403);
    assert.equal((await reviewApi.POST(request("/review", tokenB, "POST", review), context)).status, 200);
    // Coach A proposes an edit: the live answer stays "proton" until someone else approves.
    const edited = await (await itemApi.PUT(request("/edit", tokenA, "PUT", { ...input, roundType: "ROUND_ONE", riddleClues: [], answer: "a proton", questionText: "Which particle has charge +1?" }), context)).json();
    assert.equal(edited.pendingEdit, true);
    const live = await db.question.findUniqueOrThrow({ where: { id: draft.id } });
    assert.deepEqual([live.answer, live.isPrivateOnly, live.reviewStatus], ["proton", false, "APPROVED"]);
    assert.equal((await reviewApi.POST(request("/review", tokenA, "POST", { ...review, revision: live.revision }), context)).status, 403);
    assert.equal((await reviewApi.POST(request("/review", tokenB, "POST", { ...review, revision: live.revision }), context)).status, 200);
    assert.equal((await db.question.findUniqueOrThrow({ where: { id: draft.id } })).answer, "a proton");
    // Coaches cannot archive live questions; admins can.
    assert.equal((await itemApi.DELETE(request("/api/questions/" + draft.id, tokenA, "DELETE"), context)).status, 403);
  });
  await test("password reset links work once, sign out other devices, and need permission", async () => {
    const session = await login(db, student.email, password);
    await assert.rejects(() => createInvitation(db, { email: student.email, role: "STUDENT", actorId: admin.id }), (error: unknown) => (error as { status: number }).status === 409);
    const coach = await db.user.findUniqueOrThrow({ where: { email: "coach-a@example.test" } });
    await assert.rejects(() => createPasswordReset(db, { userId: admin.id, actorId: coach.id }), (error: unknown) => (error as { status: number }).status === 403);
    const reset = await createPasswordReset(db, { userId: student.id, actorId: coach.id });
    assert.equal(reset.invitation.purpose, "RESET");
    const newPassword = "new kente pass 2026";
    await acceptInvitation(db, { token: reset.token, email: student.email, password: newPassword });
    await assert.rejects(() => resolveSession(db, session.token), "Old sessions are revoked");
    await assert.rejects(() => acceptInvitation(db, { token: reset.token, email: student.email, password: newPassword }), "Single use");
    await assert.rejects(() => login(db, student.email, password));
    const fresh = await login(db, student.email, newPassword);
    assert.equal((await resolveSession(db, fresh.token)).id, student.id);
    await db.user.update({ where: { id: student.id }, data: { passwordHash: await hashPassword(password) } });
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
  await test("login throttling counts only failures, per account and per network", async () => {
    await db.authThrottle.deleteMany();
    for (let attempt = 0; attempt < 15; attempt += 1) await login(db, student.email, password, "203.0.113.5");
    for (let attempt = 0; attempt < 10; attempt += 1) await assert.rejects(() => login(db, student.email, "wrong password 123", "203.0.113.9"));
    // That network is now blocked for this account, but the student's own network is not.
    await assert.rejects(() => login(db, student.email, password, "203.0.113.9"), (error: unknown) => (error as { status: number }).status === 429);
    await login(db, student.email, password, "203.0.113.5");
    const key = hashToken("login:student@example.test");
    await db.authThrottle.update({ where: { key }, data: { count: 50 } });
    await assert.rejects(() => login(db, student.email, password, "198.51.100.1"), (error: unknown) => (error as { status: number }).status === 429);
    await db.authThrottle.deleteMany();
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
  await test("first-admin setup is closed unless enabled, and closed once an admin exists", async () => {
    const setupApi = await import("../app/api/setup/route");
    delete process.env.SETUP_SECRET;
    assert.equal((await setupApi.POST(request("/api/setup", undefined, "POST", { secret: "x", email: "owner@example.test" }))).status, 404);
    process.env.SETUP_SECRET = "a-long-random-setup-secret-for-tests";
    assert.equal((await setupApi.POST(request("/api/setup", undefined, "POST", { secret: "wrong-secret", email: "owner@example.test" }))).status, 403);
    assert.equal((await setupApi.POST(request("/api/setup", undefined, "POST", { secret: process.env.SETUP_SECRET, email: "owner@example.test" }))).status, 409);
    delete process.env.SETUP_SECRET;
  });
  await test("disabling a member signs them out; members cannot change themselves", async () => {
    const memberApi = await import("../app/api/admin/members/[id]/route");
    const session = await login(db, student.email, password);
    const context = { params: Promise.resolve({ id: student.id }) };
    assert.equal((await memberApi.PATCH(request("/m", session.token, "PATCH", { status: "DISABLED" }), context)).status, 403);
    const adminToken = (await login(db, admin.email, password)).token;
    assert.equal((await memberApi.PATCH(request("/m", adminToken, "PATCH", { status: "DISABLED" }), { params: Promise.resolve({ id: admin.id }) })).status, 400);
    assert.equal((await memberApi.PATCH(request("/m", adminToken, "PATCH", { status: "DISABLED" }), context)).status, 200);
    await assert.rejects(() => resolveSession(db, session.token));
    assert.equal((await memberApi.PATCH(request("/m", adminToken, "PATCH", { status: "ACTIVE" }), context)).status, 200);
  });
  await test("malformed query numbers are 400s and unknown questions are 404s, never crashes", async () => {
    const token = (await login(db, student.email, password)).token;
    assert.equal((await questionsApi.GET(request("/api/questions?page=abc", token))).status, 400);
    assert.equal((await questionsApi.GET(request("/api/questions?limit=-5", token))).status, 400);
    assert.equal((await trainingApi.GET(request("/api/training/questions?limit=9999", token))).status, 400);
    const adminToken = (await login(db, admin.email, password)).token;
    assert.equal((await itemApi.PUT(request("/edit", adminToken, "PUT", input), { params: Promise.resolve({ id: "missing" }) })).status, 404);
    assert.equal((await itemApi.DELETE(request("/del", adminToken, "DELETE"), { params: Promise.resolve({ id: "missing" }) })).status, 404);
  });
  console.log(passed + " foundation scenarios passed against a disposable database.");
  const { prisma } = await import("../lib/prisma");
  await prisma.$disconnect();
}
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => db.$disconnect());
