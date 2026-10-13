import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Poll as PrismaPoll,
  PollOption as PrismaPollOption,
  Quack as PrismaQuack,
  User as PrismaUser,
} from '@/generated/prisma/client';
import { NewPoll, Poll } from '@/modules/quack/domain/poll';
import { Mood, Quack } from '@/modules/quack/domain/quack';
import { Injectable } from '@nestjs/common';

const includeQuackRelations = {
  user: true,
  poll: { include: { options: { orderBy: { position: 'asc' } } } },
} as const;

const mapPrismaPollToDomain = (
  poll: PrismaPoll & { options: PrismaPollOption[] },
): Poll => ({
  id: poll.id,
  question: poll.question,
  closedAt: poll.closedAt,
  options: poll.options.map((option) => ({
    id: option.id,
    text: option.text,
  })),
});

const mapPrismaQuackToDomain = (
  quack: PrismaQuack & {
    user?: PrismaUser;
    poll?: (PrismaPoll & { options: PrismaPollOption[] }) | null;
  },
): Quack => ({
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
  poll: quack.poll ? mapPrismaPollToDomain(quack.poll) : null,
});

/**
 * If you decide to choose a different ORM or database, you should only need to change the repository files methods implementation.
 * Inject what you need instead of PrismaService and re-implement the methods and model mapping.
 */
@Injectable()
export class QuackRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getQuacks(search?: string): Promise<Quack[]> {
    const quacks = await this.prisma.quack.findMany({
      where: search
        ? {
            OR: [
              { text: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              {
                user: { username: { contains: search, mode: 'insensitive' } },
              },
            ],
          }
        : undefined,
      include: includeQuackRelations,
      orderBy: { createdAt: 'desc' },
    });
    return quacks.map(mapPrismaQuackToDomain);
  }

  async createQuack(createQuackData: {
    text: string;
    mood: Mood | null;
    userId: string;
    poll: NewPoll | null;
  }): Promise<Quack> {
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
      include: includeQuackRelations,
    });
    return mapPrismaQuackToDomain(quack);
  }
}
