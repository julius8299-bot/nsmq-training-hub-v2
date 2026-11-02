import type { PrismaClient } from "@prisma/client";

export async function repairGhanaContextFlags(prisma: PrismaClient) {
  const result = await prisma.question.updateMany({
    where: {
      OR: [
        { ghanaContext: true, isGhanaContext: false },
        { ghanaContext: false, isGhanaContext: true },
        {
          ghanaContext: false,
          isGhanaContext: false,
          tags: { contains: "ghana-context" },
        },
      ],
    },
    data: {
      ghanaContext: true,
      isGhanaContext: true,
    },
  });

  return result.count;
}
