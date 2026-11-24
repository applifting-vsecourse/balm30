import { LikeState } from '@/modules/quack/domain/like';
import { LikeRepository } from '@/modules/quack/repositories/like.repository';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { Injectable, NotFoundException } from '@nestjs/common';
import { QUACK_NOT_FOUND_MESSAGE } from './quacks.service';

@Injectable()
export class LikesService {
  constructor(
    private readonly quackRepository: QuackRepository,
    private readonly likeRepository: LikeRepository,
  ) {}

  async likeQuack(viewer: Identity, quackId: string): Promise<LikeState> {
    await this.ensureLikeable(quackId);
    await this.likeRepository.like(quackId, viewer.id);
    return this.likeRepository.getLikeState(quackId, viewer.id);
  }

  async unlikeQuack(viewer: Identity, quackId: string): Promise<LikeState> {
    await this.ensureLikeable(quackId);
    await this.likeRepository.unlike(quackId, viewer.id);
    return this.likeRepository.getLikeState(quackId, viewer.id);
  }

  private async ensureLikeable(quackId: string): Promise<void> {
    if (!(await this.quackRepository.isNotDeleted(quackId))) {
      throw new NotFoundException(QUACK_NOT_FOUND_MESSAGE);
    }
  }
}
