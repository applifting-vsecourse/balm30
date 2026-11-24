import { LikeState } from '@/modules/quack/domain/like';
import { LikeRepository } from '@/modules/quack/repositories/like.repository';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { notImplemented } from '@/shared/not-implemented';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LikesService {
  constructor(
    private readonly quackRepository: QuackRepository,
    private readonly likeRepository: LikeRepository,
  ) {}

  likeQuack: (viewer: Identity, quackId: string) => Promise<LikeState> =
    notImplemented;

  unlikeQuack: (viewer: Identity, quackId: string) => Promise<LikeState> =
    notImplemented;
}
