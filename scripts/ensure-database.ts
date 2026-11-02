import { PrismaClient } from "@prisma/client";
import { ensureRoles } from "../lib/auth/service";
const prisma = new PrismaClient();
async function main() {
  await ensureRoles(prisma);
  console.log("Database ready. Existing training records retained.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
