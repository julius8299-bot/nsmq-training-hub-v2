import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { can, canInvite, type Permission, type RoleCode } from "./policy";
import { hashPassword, hashToken, randomToken, verifyPassword } from "./crypto";

export class AccessError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const passwordSchema = z.string().min(15).max(128);
export const SESSION_SECONDS = 8 * 60 * 60;

export async function ensureRoles(db: PrismaClient) {
  for (const code of ["STUDENT", "COACH", "QUIZMASTER", "ADMIN"]) {
    await db.role.upsert({ where: { code }, update: {}, create: { code, name: code } });
    await db.user.updateMany({ where: { role: code, roleId: null }, data: { roleId: code } });
  }
}

async function throttle(db: PrismaClient, scope: string, limit: number) {
  const key = hashToken(scope);
  const now = new Date();
  await db.authThrottle.updateMany({
    where: { key, windowEndsAt: { lte: now } },
    data: { count: 0, windowEndsAt: new Date(now.getTime() + 15 * 60_000) },
  });
  const bucket = await db.authThrottle.upsert({
    where: { key },
    create: { key, count: 1, windowEndsAt: new Date(now.getTime() + 15 * 60_000) },
    update: { count: { increment: 1 } },
  });
  if (bucket.count > limit) throw new AccessError(429, "Too many attempts. Try again later.");
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
  if (existing?.passwordHash || existing?.status === "DISABLED") {
    throw new AccessError(409, "This account cannot be invited.");
  }
  const token = randomToken();
  const invitation = await db.$transaction(async (tx) => {
    await tx.invitation.updateMany({
      where: { email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const row = await tx.invitation.create({
      data: {
        email, roleCode: input.role, tokenHash: hashToken(token), createdById: actor.id,
        expiresAt: new Date(Date.now() + 48 * 60 * 60_000),
      },
    });
    await tx.auditEvent.create({
      data: { actorId: actor.id, action: "INVITATION_CREATED", entityType: "Invitation", entityId: row.id },
    });
    return row;
  });
  return { invitation, token };
}

export async function acceptInvitation(
  db: PrismaClient,
  input: { token: string; email: string; name: string; password: string },
) {
  const email = emailSchema.parse(input.email);
  passwordSchema.parse(input.password);
  const name = z.string().trim().min(1).max(100).parse(input.name);
  await throttle(db, "accept:" + hashToken(input.token), 8);
  const tokenHash = hashToken(input.token);
  const invitation = await db.invitation.findUnique({ where: { tokenHash } });
  if (!invitation || invitation.email !== email || invitation.acceptedAt ||
    invitation.revokedAt || invitation.expiresAt <= new Date()) {
    throw new AccessError(400, "The invitation is invalid or expired.");
  }
  const passwordHash = await hashPassword(input.password);
  return db.$transaction(async (tx) => {
    if (invitation.createdById) {
      const issuer = await tx.user.findUnique({ where: { id: invitation.createdById }, include: { roleDefinition: true } });
      if (!issuer || issuer.status !== "ACTIVE" || !canInvite(issuer.roleDefinition?.code ?? "", invitation.roleCode as RoleCode)) {
        throw new AccessError(400, "The invitation is invalid or expired.");
      }
    } else if (invitation.roleCode !== "ADMIN" || await tx.user.count({ where: { status: "ACTIVE", roleId: "ADMIN" } })) {
      throw new AccessError(400, "The invitation is invalid or expired.");
    }
    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date() },
    });
    if (claimed.count !== 1) throw new AccessError(400, "The invitation is invalid or expired.");
    const existing = await tx.user.findUnique({ where: { email } });
    if (existing?.passwordHash || (existing && existing.status !== "LEGACY")) {
      throw new AccessError(409, "This account cannot be activated with an invitation.");
    }
    const user = await tx.user.upsert({
      where: { email },
      create: { email, name, role: invitation.roleCode, roleId: invitation.roleCode, passwordHash, status: "ACTIVE", emailVerifiedAt: new Date() },
      update: { name, role: invitation.roleCode, roleId: invitation.roleCode, passwordHash, status: "ACTIVE", emailVerifiedAt: new Date() },
    });
    await tx.invitation.update({ where: { id: invitation.id }, data: { acceptedById: user.id } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "INVITATION_ACCEPTED", entityType: "User", entityId: user.id } });
    return user;
  });
}

export async function login(db: PrismaClient, emailInput: string, password: string) {
  const email = emailSchema.parse(emailInput);
  await throttle(db, "login:" + email, 10);
  const user = await db.user.findUnique({ where: { email }, include: { roleDefinition: true } });
  const validPassword = await verifyPassword(password, user?.passwordHash ?? null);
  if (!validPassword || !user || user.status !== "ACTIVE" || !user.roleDefinition) {
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
