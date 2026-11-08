import type { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "./prisma-factory";

export { containsText, createPrismaClient, isPostgresUrl, resolveDatabaseUrl } from "./prisma-factory";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
