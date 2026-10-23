import { PrismaService } from '@/core/prisma/prisma.service';
import { Stats } from '@/modules/stats/domain/stats';
import { Injectable } from '@nestjs/common';

@Injectable()
export class StatsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(recentSince: Date): Promise<Stats> {
    const [users, quacks, polls, votes, recentQuacks] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.quack.count(),
        this.prisma.poll.count(),
        this.prisma.pollVote.count(),
        this.prisma.quack.count({
          where: { createdAt: { gte: recentSince } },
        }),
      ]);
    return { users, quacks, polls, votes, recentQuacks };
  }
}
