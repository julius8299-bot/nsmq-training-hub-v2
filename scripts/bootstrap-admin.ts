import { createPrismaClient } from "../lib/prisma-factory";
import { ensureRoles, emailSchema } from "../lib/auth/service";
import { hashToken, randomToken } from "../lib/auth/crypto";

const database = createPrismaClient();
async function main() {
  const email = emailSchema.parse(process.env.BOOTSTRAP_ADMIN_EMAIL);
  const appUrl = new URL(process.env.APP_URL ?? "http://localhost:3000");
  await ensureRoles(database);
  const activeAdmin = await database.user.count({ where: { status: "ACTIVE", roleId: "ADMIN" } });
  if (activeAdmin) throw new Error("An active admin already exists. Use an authenticated Admin invitation.");
  const token = randomToken();
  await database.$transaction(async (tx) => {
    await tx.invitation.updateMany({ where: { roleCode: "ADMIN", createdById: null, acceptedAt: null }, data: { revokedAt: new Date() } });
    await tx.invitation.create({ data: {
      email, roleCode: "ADMIN", tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 60_000),
    } });
    await tx.auditEvent.create({ data: { action: "ADMIN_BOOTSTRAP_INVITATION", entityType: "Invitation" } });
  });
  console.log("One-use administrator activation link (expires in 30 minutes; deliver privately):");
  console.log(new URL("/accept-invite#token=" + token, appUrl).toString());
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "Bootstrap failed."); process.exitCode = 1; })
  .finally(() => database.$disconnect());
