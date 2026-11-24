import { LikeRepository } from '@/modules/quack/repositories/like.repository';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { NotFoundException } from '@nestjs/common';
import { mock, MockProxy } from 'jest-mock-extended';
import { LikesService } from './likes.service';

const alice = { id: 'alice', role: 'user' } as Identity;

describe('LikesService', () => {
  let quackRepository: MockProxy<QuackRepository>;
  let likeRepository: MockProxy<LikeRepository>;
  let service: LikesService;

  beforeEach(() => {
    quackRepository = mock<QuackRepository>();
    likeRepository = mock<LikeRepository>();
    quackRepository.isNotDeleted.mockResolvedValue(true);
    quackRepository.getAuthorId.mockResolvedValue('bob');
    likeRepository.like.mockResolvedValue();
    likeRepository.unlike.mockResolvedValue();
    service = new LikesService(quackRepository, likeRepository);
  });

  it('R1: likes the quack as the signed-in user and returns the new count', async () => {
    likeRepository.getLikeState.mockResolvedValue({
      likeCount: 1,
      likedByMe: true,
    });

    await expect(service.likeQuack(alice, 'q1')).resolves.toEqual({
      likeCount: 1,
      likedByMe: true,
    });
    expect(likeRepository.like).toHaveBeenCalledWith('q1', 'alice');
    expect(likeRepository.getLikeState).toHaveBeenCalledWith('q1', 'alice');
  });

  it('R2: takes the like back as the signed-in user and returns the new count', async () => {
    likeRepository.getLikeState.mockResolvedValue({
      likeCount: 0,
      likedByMe: false,
    });

    await expect(service.unlikeQuack(alice, 'q1')).resolves.toEqual({
      likeCount: 0,
      likedByMe: false,
    });
    expect(likeRepository.unlike).toHaveBeenCalledWith('q1', 'alice');
  });

  it('R5: lets the author like their own quack', async () => {
    quackRepository.getAuthorId.mockResolvedValue('alice');
    likeRepository.getLikeState.mockResolvedValue({
      likeCount: 1,
      likedByMe: true,
    });

    await expect(service.likeQuack(alice, 'q1')).resolves.toEqual({
      likeCount: 1,
      likedByMe: true,
    });
    expect(likeRepository.like).toHaveBeenCalledWith('q1', 'alice');
  });

  it('R7: refuses to like a deleted quack as not found', async () => {
    quackRepository.isNotDeleted.mockResolvedValue(false);

    await expect(service.likeQuack(alice, 'deleted')).rejects.toThrow(
      NotFoundException,
    );
    expect(likeRepository.like).not.toHaveBeenCalled();
  });

  it('R7: refuses to unlike a deleted quack as not found', async () => {
    quackRepository.isNotDeleted.mockResolvedValue(false);

    await expect(service.unlikeQuack(alice, 'deleted')).rejects.toThrow(
      NotFoundException,
    );
    expect(likeRepository.unlike).not.toHaveBeenCalled();
  });

  it('R8: refuses to like a quack that does not exist as not found', async () => {
    quackRepository.isNotDeleted.mockResolvedValue(false);
    quackRepository.getAuthorId.mockResolvedValue(null);

    await expect(service.likeQuack(alice, 'missing')).rejects.toThrow(
      NotFoundException,
    );
    expect(likeRepository.like).not.toHaveBeenCalled();
  });
});
