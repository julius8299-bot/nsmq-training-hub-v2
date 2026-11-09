import { createPrismaClient } from "../lib/prisma-factory";
import { ensureRoles } from "../lib/auth/service";
const prisma = createPrismaClient();
async function main() {
  await ensureRoles(prisma);
  console.log("Database ready. Existing training records retained.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
