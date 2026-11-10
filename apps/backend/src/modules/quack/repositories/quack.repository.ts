import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { NewPoll } from '@/modules/quack/domain/poll';
import {
  Mood,
  QuackFilter,
  QuackRecord,
  QuackThread,
} from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';
import { mapPrismaPollToDomain, pollIncludeFor } from './prisma-poll';

const NOT_DELETED = { deletedAt: null } satisfies Prisma.QuackWhereInput;

const SHOWN_IN_THREAD = {
  OR: [NOT_DELETED, { replies: { some: NOT_DELETED } }],
} satisfies Prisma.QuackWhereInput;

const includeQuackRelationsFor = (viewerId: string) =>
  ({
    user: true,
    poll: { include: pollIncludeFor(viewerId) },
    parent: {
      select: {
        id: true,
        deletedAt: true,
        user: { select: { username: true, displayUsername: true } },
      },
    },
    _count: { select: { replies: { where: NOT_DELETED } } },
  }) as const;

type PrismaQuackWithRelations = Prisma.QuackGetPayload<{
  include: ReturnType<typeof includeQuackRelationsFor>;
}>;

const usernameOf = (user: {
  username: string | null;
  displayUsername: string | null;
}): string => user.displayUsername ?? user.username ?? '';

const mapPrismaQuackToDomain = (
  quack: PrismaQuackWithRelations,
  viewerId: string,
): QuackRecord => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood,
  userId: quack.userId,
  createdAt: quack.createdAt,
  updatedAt: quack.updatedAt,
  deletedAt: quack.deletedAt,
  user: {
    id: quack.user.id,
    name: quack.user.name,
    username: usernameOf(quack.user),
  },
  poll: quack.poll ? mapPrismaPollToDomain(quack.poll, viewerId) : null,
  replyingTo: quack.parent
    ? {
        quackId: quack.parent.id,
        username: quack.parent.deletedAt ? null : usernameOf(quack.parent.user),
      }
    : null,
  replyCount: quack._count.replies,
});

const searchCondition = (search: string): Prisma.QuackWhereInput => ({
  OR: [
    { text: { contains: search, mode: 'insensitive' } },
    { user: { name: { contains: search, mode: 'insensitive' } } },
    { user: { username: { contains: search, mode: 'insensitive' } } },
    { poll: { question: { contains: search, mode: 'insensitive' } } },
  ],
});

/**
 * If you decide to choose a different ORM or database, you should only need to change the repository files methods implementation.
 * Inject what you need instead of PrismaService and re-implement the methods and model mapping.
 */
@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getQuacks(
    viewerId: string,
    { search, authorId }: QuackFilter = {},
  ): Promise<QuackRecord[]> {
    const quacks = await this.prisma.quack.findMany({
      where: {
        ...NOT_DELETED,
        ...(search ? searchCondition(search) : {}),
        ...(authorId ? { userId: authorId } : {}),
      },
      include: includeQuackRelationsFor(viewerId),
      orderBy: { createdAt: 'desc' },
    });
    return quacks.map((quack) => mapPrismaQuackToDomain(quack, viewerId));
  }

  async getQuackThread(
    viewerId: string,
    quackId: string,
  ): Promise<QuackThread<QuackRecord> | null> {
    const quack = await this.prisma.quack.findUnique({
      where: { id: quackId },
      include: {
        ...includeQuackRelationsFor(viewerId),
        replies: {
          where: SHOWN_IN_THREAD,
          include: includeQuackRelationsFor(viewerId),
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!quack) {
      return null;
    }
    return {
      quack: mapPrismaQuackToDomain(quack, viewerId),
      replies: quack.replies.map((reply) =>
        mapPrismaQuackToDomain(reply, viewerId),
      ),
    };
  }

  async createQuack(createQuackData: {
    text: string;
    mood: Mood | null;
    userId: string;
    poll: NewPoll | null;
    parentId: string | null;
  }): Promise<QuackRecord> {
    const { poll, parentId } = createQuackData;
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        user: { connect: { id: createQuackData.userId } },
        parent: parentId ? { connect: { id: parentId } } : undefined,
        poll: poll
          ? {
              create: {
                question: poll.question,
                options: {
                  create: poll.options.map((text, position) => ({
                    text,
                    position,
                  })),
                },
              },
            }
          : undefined,
      },
      include: includeQuackRelationsFor(createQuackData.userId),
    });
    return mapPrismaQuackToDomain(quack, createQuackData.userId);
  }

  async isNotDeleted(quackId: string): Promise<boolean> {
    const count = await this.prisma.quack.count({
      where: { id: quackId, ...NOT_DELETED },
    });
    return count > 0;
  }

  async getAuthorId(quackId: string): Promise<string | null> {
    const quack = await this.prisma.quack.findFirst({
      where: { id: quackId, ...NOT_DELETED },
      select: { userId: true },
    });
    return quack?.userId ?? null;
  }

  async deleteQuack(quackId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.poll.deleteMany({ where: { quackId } }),
      this.prisma.quack.updateMany({
        where: { id: quackId, ...NOT_DELETED },
        data: { deletedAt: new Date(), text: '', mood: null },
      }),
    ]);
  }
}
