import { PrismaService } from '@/core/prisma/prisma.service';
import {
  connectTestDatabase,
  truncateAllTables,
} from '@/test/integration/database';
import {
  addLikes,
  createQuack,
  createUsers,
  daysAgo,
} from '@/test/integration/fixtures';
import { QuackRepository } from './quack.repository';

describe('QuackRepository sorting', () => {
  let prisma: PrismaService;
  let repository: QuackRepository;
  let viewer: string;
  let oldestWithTwo: string;
  let middleWithFive: string;
  let newestWithTwo: string;

  beforeAll(async () => {
    prisma = await connectTestDatabase();
    repository = new QuackRepository(prisma);
  });

  beforeEach(async () => {
    await truncateAllTables(prisma);
    const users = await createUsers(prisma, ['U1', 'U2', 'U3', 'U4', 'U5']);
    viewer = users[0];
    oldestWithTwo = await createQuack(prisma, viewer, {
      text: 'A',
      createdAt: daysAgo(3),
    });
    middleWithFive = await createQuack(prisma, viewer, {
      text: 'B',
      createdAt: daysAgo(2),
    });
    newestWithTwo = await createQuack(prisma, viewer, {
      text: 'C',
      createdAt: daysAgo(1),
    });
    await addLikes(prisma, oldestWithTwo, users.slice(0, 2));
    await addLikes(prisma, middleWithFive, users);
    await addLikes(prisma, newestWithTwo, users.slice(0, 2));
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('R10: most liked first, ties newest first', async () => {
    const quacks = await repository.getQuacks(viewer, { sort: 'likes' });

    expect(quacks.map((quack) => quack.id)).toEqual([
      middleWithFive,
      newestWithTwo,
      oldestWithTwo,
    ]);
  });

  it('R11: newest first when no sort is chosen', async () => {
    const quacks = await repository.getQuacks(viewer);

    expect(quacks.map((quack) => quack.id)).toEqual([
      newestWithTwo,
      middleWithFive,
      oldestWithTwo,
    ]);
  });
});
