import { PrismaService } from '@/core/prisma/prisma.service';
import { Quack } from '@/generated/prisma/client';

type CreateQuackParams = {
  text: string;
  userId: string;
  // Optional so the seed can spread posts over time. Without it every seeded
  // quack shares one timestamp and the feed reads like a single burst.
  createdAt?: Date;
  parentId?: string;
  deletedAt?: Date;
};

export async function createQuack(
  prisma: PrismaService,
  params: CreateQuackParams,
): Promise<Quack> {
  const { text, userId, createdAt, parentId, deletedAt } = params;

  return await prisma.quack.create({
    data: {
      text,
      createdAt,
      deletedAt,
      parent: parentId ? { connect: { id: parentId } } : undefined,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
