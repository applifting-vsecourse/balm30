import { PrismaService } from '@/core/prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

export const daysAgo = (days: number, now = new Date()): Date =>
  new Date(now.getTime() - days * DAY_MS);

export async function createUser(
  prisma: PrismaService,
  name: string,
): Promise<string> {
  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: `user-${name.toLowerCase()}`,
      name,
      email: `${name.toLowerCase()}@example.com`,
      emailVerified: true,
      username: name,
      createdAt: now,
      updatedAt: now,
    },
  });
  return user.id;
}

export async function createUsers(
  prisma: PrismaService,
  names: string[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    ids.push(await createUser(prisma, name));
  }
  return ids;
}

export async function createQuack(
  prisma: PrismaService,
  userId: string,
  {
    text = 'A quack',
    createdAt = new Date(),
    deletedAt = null,
  }: { text?: string; createdAt?: Date; deletedAt?: Date | null } = {},
): Promise<string> {
  const quack = await prisma.quack.create({
    data: { userId, text, createdAt, deletedAt },
  });
  return quack.id;
}

export async function addLike(
  prisma: PrismaService,
  quackId: string,
  userId: string,
  createdAt = new Date(),
): Promise<void> {
  await prisma.like.create({ data: { quackId, userId, createdAt } });
}

export async function addLikes(
  prisma: PrismaService,
  quackId: string,
  userIds: string[],
): Promise<void> {
  for (const userId of userIds) {
    await addLike(prisma, quackId, userId);
  }
}
