import { PrismaService } from '@/core/prisma/prisma.service';
import { LikeState } from '@/modules/quack/domain/like';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async like(quackId: string, userId: string): Promise<void> {
    await this.prisma.like.createMany({
      data: [{ quackId, userId }],
      skipDuplicates: true,
    });
  }

  async unlike(quackId: string, userId: string): Promise<void> {
    await this.prisma.like.deleteMany({ where: { quackId, userId } });
  }

  async getLikeState(quackId: string, viewerId: string): Promise<LikeState> {
    const [likeCount, viewerLikes] = await this.prisma.$transaction([
      this.prisma.like.count({ where: { quackId } }),
      this.prisma.like.count({ where: { quackId, userId: viewerId } }),
    ]);
    return { likeCount, likedByMe: viewerLikes > 0 };
  }
}
