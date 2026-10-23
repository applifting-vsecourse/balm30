import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Prisma,
  Quack as PrismaQuack,
  User as PrismaUser,
} from '@/generated/prisma/client';
import { NewPoll } from '@/modules/quack/domain/poll';
import { Mood, QuackFilter, QuackRecord } from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';
import {
  mapPrismaPollToDomain,
  pollIncludeFor,
  PrismaPollWithViewer,
} from './prisma-poll';

const includeQuackRelationsFor = (viewerId: string) =>
  ({
    user: true,
    poll: { include: pollIncludeFor(viewerId) },
  }) as const;

const mapPrismaQuackToDomain = (
  quack: PrismaQuack & {
    user?: PrismaUser;
    poll?: PrismaPollWithViewer | null;
  },
  viewerId: string,
): QuackRecord => ({
  id: quack.id,
  text: quack.text,
  mood: quack.mood,
  userId: quack.userId,
  createdAt: quack.createdAt,
  updatedAt: quack.updatedAt,
  user: quack.user
    ? {
        id: quack.user.id,
        name: quack.user.name,
        username: quack.user.displayUsername ?? quack.user.username ?? '',
      }
    : undefined,
  poll: quack.poll ? mapPrismaPollToDomain(quack.poll, viewerId) : null,
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
        ...(search ? searchCondition(search) : {}),
        ...(authorId ? { userId: authorId } : {}),
      },
      include: includeQuackRelationsFor(viewerId),
      orderBy: { createdAt: 'desc' },
    });
    return quacks.map((quack) => mapPrismaQuackToDomain(quack, viewerId));
  }

  async createQuack(createQuackData: {
    text: string;
    mood: Mood | null;
    userId: string;
    poll: NewPoll | null;
  }): Promise<QuackRecord> {
    const { poll } = createQuackData;
    const quack = await this.prisma.quack.create({
      data: {
        text: createQuackData.text,
        mood: createQuackData.mood,
        user: { connect: { id: createQuackData.userId } },
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

  async getAuthorId(quackId: string): Promise<string | null> {
    const quack = await this.prisma.quack.findUnique({
      where: { id: quackId },
      select: { userId: true },
    });
    return quack?.userId ?? null;
  }

  async deleteQuack(quackId: string): Promise<void> {
    await this.prisma.quack.deleteMany({ where: { id: quackId } });
  }
}
