import { PrismaService } from '@/core/prisma/prisma.service';
import {
  connectTestDatabase,
  truncateAllTables,
} from '@/test/integration/database';
import {
  addLike,
  createQuack,
  createUsers,
  daysAgo,
} from '@/test/integration/fixtures';
import { StatsRepository } from './stats.repository';

describe('StatsRepository likes', () => {
  const now = new Date('2026-11-24T12:00:00Z');
  const recentSince = daysAgo(7, now);
  let prisma: PrismaService;
  let repository: StatsRepository;
  let users: string[];

  beforeAll(async () => {
    prisma = await connectTestDatabase();
    repository = new StatsRepository(prisma);
  });

  beforeEach(async () => {
    await truncateAllTables(prisma);
    users = await createUsers(prisma, ['U1', 'U2', 'U3', 'U4', 'U5']);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('R12: counts all likes, and recent ones from exactly 7 days ago', async () => {
    const quackId = await createQuack(prisma, users[0]);
    await addLike(prisma, quackId, users[0], daysAgo(2, now));
    await addLike(prisma, quackId, users[1], recentSince);
    await addLike(prisma, quackId, users[2], daysAgo(8, now));

    const stats = await repository.getStats(recentSince);

    expect(stats).toMatchObject({ likes: 3, recentLikes: 2 });
  });

  it("R13: doesn't count likes on deleted quacks", async () => {
    const live = await createQuack(prisma, users[0]);
    const deleted = await createQuack(prisma, users[0], {
      deletedAt: daysAgo(1, now),
    });
    await addLike(prisma, live, users[0], daysAgo(1, now));
    await addLike(prisma, live, users[1], daysAgo(1, now));
    await addLike(prisma, deleted, users[2], daysAgo(1, now));
    await addLike(prisma, deleted, users[3], daysAgo(1, now));
    await addLike(prisma, deleted, users[4], daysAgo(1, now));

    const stats = await repository.getStats(recentSince);

    expect(stats).toMatchObject({ likes: 2, recentLikes: 2 });
  });
});
