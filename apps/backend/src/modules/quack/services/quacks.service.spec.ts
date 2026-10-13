// Example unit test — the pattern to copy for your own services.
// The repository is mocked, so the test exercises the service in isolation.
import { Poll } from '@/modules/quack/domain/poll';
import { Quack } from '@/modules/quack/domain/quack';
import { QuackRepository } from '@/modules/quack/repositories/quack.repository';
import { Identity } from '@/shared/auth/domain/identity';
import { BadRequestException, Logger } from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import { QuacksService, TEXT_OR_POLL_REQUIRED_MESSAGE } from './quacks.service';

const aQuack = (overrides: Partial<Quack> = {}): Quack => ({
  id: 'q1',
  text: 'quack quack',
  mood: null,
  userId: 'u1',
  createdAt: new Date('2026-01-01T12:00:00Z'),
  updatedAt: new Date('2026-01-01T12:00:00Z'),
  user: { id: 'u1', name: 'Caffeinated Duck', username: 'CaffeinatedDuck' },
  poll: null,
  ...overrides,
});

const viewer = { id: 'u1' } as Identity;

describe('QuacksService', () => {
  it('returns quacks from the repository', async () => {
    const quacks = [aQuack()];
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue(quacks);

    const service = new QuacksService(repository);

    await expect(service.getQuacks(viewer)).resolves.toEqual(quacks);
    expect(repository.getQuacks).toHaveBeenCalledTimes(1);
    expect(repository.getQuacks).toHaveBeenCalledWith('u1');
  });

  it('searches with the trimmed term and a leading @ removed', async () => {
    const quacks = [aQuack()];
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue(quacks);

    const service = new QuacksService(repository);

    await expect(
      service.getQuacks(viewer, '  @CaffeinatedDuck '),
    ).resolves.toEqual(quacks);
    expect(repository.getQuacks).toHaveBeenCalledWith('u1', 'CaffeinatedDuck');
  });

  it.each(['', '   ', '@'])(
    'returns the full feed for the blank search %j',
    async (search) => {
      const repository = mock<QuackRepository>();
      repository.getQuacks.mockResolvedValue([]);

      const service = new QuacksService(repository);
      await service.getQuacks(viewer, search);

      expect(repository.getQuacks).toHaveBeenCalledWith('u1');
    },
  );

  it('logs the search term and the number of results', async () => {
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue([aQuack(), aQuack({ id: 'q2' })]);
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const service = new QuacksService(repository);
    await service.getQuacks(viewer, 'pond');

    expect(log).toHaveBeenCalledWith('Quack search q="pond" results=2');
    log.mockRestore();
  });

  it('does not log when there is no search', async () => {
    const repository = mock<QuackRepository>();
    repository.getQuacks.mockResolvedValue([]);
    const log = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);

    const service = new QuacksService(repository);
    await service.getQuacks(viewer, '  ');

    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it('creates a quack owned by the signed-in user', async () => {
    const created = aQuack({ id: 'q2', text: 'hello' });
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(created);

    const service = new QuacksService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(service.createQuack(user, { text: 'hello' })).resolves.toEqual(
      created,
    );
    // the author comes from the session, not from the caller's payload
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'hello',
      mood: null,
      userId: 'u1',
      poll: null,
    });
  });

  it('passes the chosen mood through to the repository', async () => {
    const created = aQuack({ id: 'q3', text: 'lol', mood: 'silly' });
    const repository = mock<QuackRepository>();
    repository.createQuack.mockResolvedValue(created);

    const service = new QuacksService(repository);
    const user = { id: 'u1' } as Identity;

    await expect(
      service.createQuack(user, { text: 'lol', mood: 'silly' }),
    ).resolves.toEqual(created);
    expect(repository.createQuack).toHaveBeenCalledWith({
      text: 'lol',
      mood: 'silly',
      userId: 'u1',
      poll: null,
    });
  });

  describe('with a poll', () => {
    const newPoll = {
      question: 'Where should we hold the picnic?',
      options: ['North end', 'West bank'],
    };
    const aPoll = (): Poll => ({
      id: 'p1',
      question: newPoll.question,
      closedAt: null,
      options: [
        { id: 'o1', text: 'North end', votes: 0 },
        { id: 'o2', text: 'West bank', votes: 0 },
      ],
      totalVotes: 0,
      myOptionId: null,
      canClose: true,
    });

    it('passes the poll through to the repository', async () => {
      const created = aQuack({ poll: aPoll() });
      const repository = mock<QuackRepository>();
      repository.createQuack.mockResolvedValue(created);

      const service = new QuacksService(repository);
      const user = { id: 'u1' } as Identity;

      await expect(
        service.createQuack(user, { text: 'Vote!', poll: newPoll }),
      ).resolves.toEqual(created);
      expect(repository.createQuack).toHaveBeenCalledWith({
        text: 'Vote!',
        mood: null,
        userId: 'u1',
        poll: newPoll,
      });
    });

    it('creates a poll quack without text', async () => {
      const repository = mock<QuackRepository>();
      repository.createQuack.mockResolvedValue(
        aQuack({ text: '', poll: aPoll() }),
      );

      const service = new QuacksService(repository);
      await service.createQuack({ id: 'u1' } as Identity, { poll: newPoll });

      expect(repository.createQuack).toHaveBeenCalledWith(
        expect.objectContaining({ text: '', poll: newPoll }),
      );
    });

    it('logs the created poll', async () => {
      const repository = mock<QuackRepository>();
      repository.createQuack.mockResolvedValue(aQuack({ poll: aPoll() }));
      const log = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => undefined);

      const service = new QuacksService(repository);
      await service.createQuack({ id: 'u1' } as Identity, { poll: newPoll });

      expect(log).toHaveBeenCalledWith('Poll created poll=p1 options=2');
      log.mockRestore();
    });
  });

  it.each([undefined, '', '   '])(
    'rejects a quack with the text %j and no poll',
    async (text) => {
      const repository = mock<QuackRepository>();

      const service = new QuacksService(repository);

      await expect(
        service.createQuack({ id: 'u1' } as Identity, { text }),
      ).rejects.toEqual(new BadRequestException(TEXT_OR_POLL_REQUIRED_MESSAGE));
      expect(repository.createQuack).not.toHaveBeenCalled();
    },
  );
});
