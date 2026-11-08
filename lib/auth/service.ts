import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { can, canInvite, canManageUser, type Permission, type RoleCode } from "./policy";
import { hashPassword, hashToken, randomToken, verifyPassword } from "./crypto";

export class AccessError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

// Students sign in on shared school devices and phones, so the minimum is a memorable 10 characters
// plus a block on the passwords attackers try first (NIST SP 800-63B favours length + blocklists).
const COMMON_PASSWORDS = new Set([
  "password12", "password123", "1234567890", "0123456789", "qwertyuiop", "1q2w3e4r5t", "iloveyou12",
  "abcdefghij", "nsmq123456", "nsmqtraining", "ghanata123", "ghanatashs", "carpediem1", "science123",
  "mathematics", "chemistry1", "password1234", "letmein1234", "welcome123", "admin12345",
]);
export const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128)
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase().replace(/\s+/g, "")), "That password is too common. Try a short phrase.")
  .refine((value) => new Set(value.toLowerCase()).size >= 4, "Use a password with more variety.");

export const SESSION_SECONDS = 8 * 60 * 60;
export const INVITATION_HOURS = 72;
export const RESET_HOURS = 24;

export async function ensureRoles(db: PrismaClient) {
  for (const code of ["STUDENT", "COACH", "QUIZMASTER", "ADMIN"]) {
    await db.role.upsert({ where: { code }, update: {}, create: { code, name: code } });
    await db.user.updateMany({ where: { role: code, roleId: null }, data: { roleId: code } });
  }
}

// Failure counters. Only wrong passwords count, so a class signing in together never trips them.
const WINDOW_MS = 15 * 60_000;
const LIMITS = { accountFromNetwork: 10, account: 50, network: 100 };

function throttleKeys(email: string, network?: string) {
  const keys: { key: string; limit: number }[] = [
    // Legacy key name kept so existing counters and tests keep their meaning.
    { key: hashToken("login:" + email), limit: LIMITS.account },
  ];
  if (network) {
    keys.push({ key: hashToken("login:" + email + "@" + network), limit: LIMITS.accountFromNetwork });
    keys.push({ key: hashToken("login-network:" + network), limit: LIMITS.network });
  }
  return keys;
}

async function assertNotThrottled(db: PrismaClient, keys: { key: string; limit: number }[]) {
  const now = new Date();
  const buckets = await db.authThrottle.findMany({ where: { key: { in: keys.map((item) => item.key) }, windowEndsAt: { gt: now } } });
  for (const bucket of buckets) {
    const limit = keys.find((item) => item.key === bucket.key)!.limit;
    if (bucket.count >= limit) throw new AccessError(429, "Too many incorrect attempts. Wait 15 minutes or ask your coach to reset your password.");
  }
}

async function recordFailure(db: PrismaClient, keys: { key: string }[]) {
  const now = new Date();
  const windowEndsAt = new Date(now.getTime() + WINDOW_MS);
  for (const { key } of keys) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await db.authThrottle.updateMany({ where: { key, windowEndsAt: { lte: now } }, data: { count: 0, windowEndsAt } });
        await db.authThrottle.upsert({ where: { key }, create: { key, count: 1, windowEndsAt }, update: { count: { increment: 1 } } });
        break;
      } catch (error) {
        // Two first failures at the same instant can race on the unique key; the retry increments instead.
        if (attempt === 1) throw error;
      }
    }
  }
}

/** Single-use counter for invitation/reset tokens (not tied to passwords). */
async function countUse(db: PrismaClient, scope: string, limit: number) {
  const key = hashToken(scope);
  await assertNotThrottled(db, [{ key, limit }]);
  await recordFailure(db, [{ key }]);
}

export async function createInvitation(
  db: PrismaClient,
  input: { email: string; role: RoleCode; actorId: string },
) {
  const email = emailSchema.parse(input.email);
  const actor = await db.user.findUnique({ where: { id: input.actorId }, include: { roleDefinition: true } });
  if (!actor || actor.status !== "ACTIVE" || !canInvite(actor.roleDefinition?.code ?? "", input.role)) {
    throw new AccessError(403, "You cannot issue this invitation.");
  }
  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.status === "DISABLED") throw new AccessError(409, "This account is disabled. An administrator can re-enable it.");
  if (existing?.passwordHash) {
    throw new AccessError(409, "This person already has an account. Use \"Reset password\" in the members list instead.");
  }
  return issueToken(db, { email, roleCode: input.role, actorId: actor.id, purpose: "INVITE", hours: INVITATION_HOURS });
}

/** A one-use link that lets an existing member choose a new password. Coaches can reset students; admins anyone. */
export async function createPasswordReset(db: PrismaClient, input: { userId: string; actorId: string }) {
  const [actor, user] = await Promise.all([
    db.user.findUnique({ where: { id: input.actorId }, include: { roleDefinition: true } }),
    db.user.findUnique({ where: { id: input.userId }, include: { roleDefinition: true } }),
  ]);
  if (!actor || actor.status !== "ACTIVE" || !user || !canManageUser(actor.roleDefinition?.code ?? "", user.roleDefinition?.code ?? user.role)) {
    throw new AccessError(403, "You cannot reset this member's password.");
  }
  if (user.status === "DISABLED") throw new AccessError(409, "Re-enable this account before resetting its password.");
  return issueToken(db, {
    email: user.email, roleCode: (user.roleDefinition?.code ?? user.role) as RoleCode, actorId: actor.id,
    purpose: user.passwordHash ? "RESET" : "INVITE", hours: RESET_HOURS,
  });
}

async function issueToken(db: PrismaClient, input: { email: string; roleCode: RoleCode; actorId: string; purpose: "INVITE" | "RESET"; hours: number }) {
  const token = randomToken();
  const invitation = await db.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: { email: input.email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const row = await tx.invitation.create({
      data: {
        email: input.email, roleCode: input.roleCode, tokenHash: hashToken(token), createdById: input.actorId,
        purpose: input.purpose, expiresAt: new Date(Date.now() + input.hours * 60 * 60_000),
      },
    });
    await tx.auditEvent.create({
      data: { actorId: input.actorId, action: input.purpose === "RESET" ? "PASSWORD_RESET_CREATED" : "INVITATION_CREATED", entityType: "Invitation", entityId: row.id },
    });
    return row;
  });
  return { invitation, token };
}

export async function acceptInvitation(
  db: PrismaClient,
  input: { token: string; email: string; name?: string; password: string },
) {
  const email = emailSchema.parse(input.email);
  passwordSchema.parse(input.password);
  await countUse(db, "accept:" + hashToken(input.token), 8);
  const tokenHash = hashToken(input.token);
  const invitation = await db.invitation.findUnique({ where: { tokenHash } });
  if (!invitation || invitation.email !== email || invitation.acceptedAt ||
    invitation.revokedAt || invitation.expiresAt <= new Date()) {
    throw new AccessError(400, "The link is invalid or expired. Ask your coach for a new one.");
  }
  const reset = invitation.purpose === "RESET";
  const name = reset ? undefined : z.string().trim().min(1).max(100).parse(input.name);
  const passwordHash = await hashPassword(input.password);
  return db.$transaction(async (tx) => {
    if (invitation.createdById) {
      const issuer = await tx.user.findUnique({ where: { id: invitation.createdById }, include: { roleDefinition: true } });
      if (!issuer || issuer.status !== "ACTIVE" || !canInvite(issuer.roleDefinition?.code ?? "", invitation.roleCode as RoleCode)) {
        throw new AccessError(400, "The link is invalid or expired. Ask your coach for a new one.");
      }
    } else if (invitation.roleCode !== "ADMIN" || await tx.user.count({ where: { status: "ACTIVE", roleId: "ADMIN" } })) {
      throw new AccessError(400, "The link is invalid or expired. Ask your coach for a new one.");
    }
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count !== 1) throw new AccessError(400, "The link is invalid or expired. Ask your coach for a new one.");
    const existing = await tx.user.findUnique({ where: { email } });
    let user;
    if (reset) {
      if (!existing || existing.status !== "ACTIVE") throw new AccessError(409, "This account cannot be reset.");
      user = await tx.user.update({ where: { id: existing.id }, data: { passwordHash } });
      // A new password signs the member out everywhere else.
      await tx.authSession.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
    } else {
      if (existing?.passwordHash || (existing && existing.status !== "LEGACY")) {
        throw new AccessError(409, "This account is already active. Sign in, or ask your coach for a password reset link.");
      }
      user = await tx.user.upsert({
        where: { email },
        create: { email, name: name!, role: invitation.roleCode, roleId: invitation.roleCode, passwordHash, status: "ACTIVE", emailVerifiedAt: new Date() },
        update: { name: name!, role: invitation.roleCode, roleId: invitation.roleCode, passwordHash, status: "ACTIVE", emailVerifiedAt: new Date() },
      });
    }
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedById: user.id } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: reset ? "PASSWORD_RESET_COMPLETED" : "INVITATION_ACCEPTED", entityType: "User", entityId: user.id } });
    return user;
  });
}

export async function login(db: PrismaClient, emailInput: string, password: string, network?: string) {
  const email = emailSchema.parse(emailInput);
  const keys = throttleKeys(email, network);
  await assertNotThrottled(db, keys);
  const user = await db.user.findUnique({ where: { email }, include: { roleDefinition: true } });
  const validPassword = await verifyPassword(password, user?.passwordHash ?? null);
  if (!validPassword || !user || user.status !== "ACTIVE" || !user.roleDefinition) {
    await recordFailure(db, keys);
    throw new AccessError(401, "Email or password is incorrect.");
  }
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  await db.$transaction([
    db.authSession.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt } }),
    db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
    db.auditEvent.create({ data: { actorId: user.id, action: "LOGIN", entityType: "User", entityId: user.id } }),
  ]);
  return { token, expiresAt };
}

export async function resolveSession(db: PrismaClient, token: string | undefined, permission?: Permission) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new AccessError(401, "Sign in to continue.");
  const session = await db.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { roleDefinition: true } } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.status !== "ACTIVE") {
    throw new AccessError(401, "Sign in to continue.");
  }
  const role = session.user.roleDefinition?.code ?? "";
  if (!can(role, permission ?? "train")) throw new AccessError(403, "You do not have permission.");
  return { id: session.user.id, name: session.user.name, email: session.user.email, role };
}

/** First administrator, created from the /setup page with the SETUP_SECRET held only by the site owner. */
export async function createBootstrapInvitation(db: PrismaClient, emailInput: string) {
  const email = emailSchema.parse(emailInput);
  await ensureRoles(db);
  if (await db.user.count({ where: { status: "ACTIVE", roleId: "ADMIN" } })) {
    throw new AccessError(409, "An administrator already exists. Ask them for an invitation.");
  }
  const token = randomToken();
  await db.$transaction(async (tx) => {
    await tx.invitation.updateMany({ where: { roleCode: "ADMIN", createdById: null, acceptedAt: null }, data: { revokedAt: new Date() } });
    await tx.invitation.create({ data: { email, roleCode: "ADMIN", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60_000) } });
    await tx.auditEvent.create({ data: { action: "ADMIN_BOOTSTRAP_INVITATION", entityType: "Invitation" } });
  });
  return token;
}
