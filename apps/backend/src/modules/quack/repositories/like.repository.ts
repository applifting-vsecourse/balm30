import { PrismaService } from '@/core/prisma/prisma.service';
import { LikeState } from '@/modules/quack/domain/like';
import { notImplemented } from '@/shared/not-implemented';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LikeRepository {
  constructor(private readonly prisma: PrismaService) {}

  like: (quackId: string, userId: string) => Promise<void> = notImplemented;

  unlike: (quackId: string, userId: string) => Promise<void> = notImplemented;

  getLikeState: (quackId: string, viewerId: string) => Promise<LikeState> =
    notImplemented;
}
