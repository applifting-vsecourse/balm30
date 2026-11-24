import { PrismaService } from '@/core/prisma/prisma.service';
import {
  connectTestDatabase,
  truncateAllTables,
} from '@/test/integration/database';
import { addLike, createQuack, createUsers } from '@/test/integration/fixtures';
import { LikeRepository } from './like.repository';

describe('LikeRepository', () => {
  let prisma: PrismaService;
  let repository: LikeRepository;
  let alice: string;
  let bob: string;
  let carol: string;
  let quackId: string;

  beforeAll(async () => {
    prisma = await connectTestDatabase();
    repository = new LikeRepository(prisma);
  });

  beforeEach(async () => {
    await truncateAllTables(prisma);
    [alice, bob, carol] = await createUsers(prisma, ['Alice', 'Bob', 'Carol']);
    quackId = await createQuack(prisma, carol);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('R1: a like on a quack with 0 likes makes the count 1', async () => {
    await expect(repository.like(quackId, alice)).resolves.toBeUndefined();

    await expect(repository.getLikeState(quackId, alice)).resolves.toEqual({
      likeCount: 1,
      likedByMe: true,
    });
  });

  it('R2: unliking my only like makes the count 0', async () => {
    await addLike(prisma, quackId, alice);

    await expect(repository.unlike(quackId, alice)).resolves.toBeUndefined();

    await expect(repository.getLikeState(quackId, alice)).resolves.toEqual({
      likeCount: 0,
      likedByMe: false,
    });
  });

  it('R3: liking again leaves the count at 1', async () => {
    await addLike(prisma, quackId, alice);

    await expect(repository.like(quackId, alice)).resolves.toBeUndefined();

    await expect(repository.getLikeState(quackId, alice)).resolves.toEqual({
      likeCount: 1,
      likedByMe: true,
    });
  });

  it('R4: unliking without a like leaves the count at 0', async () => {
    await expect(repository.unlike(quackId, alice)).resolves.toBeUndefined();

    await expect(repository.getLikeState(quackId, alice)).resolves.toEqual({
      likeCount: 0,
      likedByMe: false,
    });
  });

  it('R6: each user counts once, and likedByMe is per viewer', async () => {
    await addLike(prisma, quackId, alice);

    await expect(repository.like(quackId, bob)).resolves.toBeUndefined();

    await expect(repository.getLikeState(quackId, bob)).resolves.toEqual({
      likeCount: 2,
      likedByMe: true,
    });
    await expect(repository.getLikeState(quackId, alice)).resolves.toEqual({
      likeCount: 2,
      likedByMe: true,
    });
    await expect(repository.getLikeState(quackId, carol)).resolves.toEqual({
      likeCount: 2,
      likedByMe: false,
    });
  });
});
