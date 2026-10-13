import {
  Poll,
  PollClosedError,
  PollNotAuthorError,
  PollNotFoundError,
  PollOptionNotFoundError,
  VoteChange,
} from '@/modules/quack/domain/poll';
import { PollRepository } from '@/modules/quack/repositories/poll.repository';
import { Identity } from '@/shared/auth/domain/identity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { mock } from 'jest-mock-extended';
import {
  NOT_POLL_AUTHOR_MESSAGE,
  OPTION_NOT_IN_POLL_MESSAGE,
  POLL_CLOSED_MESSAGE,
  POLL_NOT_FOUND_MESSAGE,
  PollsService,
} from './polls.service';

const user = { id: 'u1' } as Identity;

const aPoll = (overrides: Partial<Poll> = {}): Poll => ({
  id: 'p1',
  question: 'Where do we go for lunch?',
  closedAt: null,
  options: [
    { id: 'o1', text: 'Pizza', votes: 2 },
    { id: 'o2', text: 'Soup', votes: 1 },
  ],
  totalVotes: 3,
  myOptionId: 'o1',
  canClose: false,
  ...overrides,
});

const spyOnLog = (): jest.SpyInstance =>
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

describe('PollsService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('votes as the signed-in user and returns the poll as they see it', async () => {
    const poll = aPoll();
    const repository = mock<PollRepository>();
    repository.setVote.mockResolvedValue('cast');
    repository.getPoll.mockResolvedValue(poll);

    const service = new PollsService(repository);

    await expect(service.vote(user, 'p1', 'o1')).resolves.toEqual(poll);
    expect(repository.setVote).toHaveBeenCalledWith('p1', 'u1', 'o1');
    expect(repository.getPoll).toHaveBeenCalledWith('p1', 'u1');
  });

  it("removes the signed-in user's vote and returns the poll", async () => {
    const poll = aPoll({ myOptionId: null });
    const repository = mock<PollRepository>();
    repository.removeVote.mockResolvedValue('removed');
    repository.getPoll.mockResolvedValue(poll);

    const service = new PollsService(repository);

    await expect(service.removeVote(user, 'p1')).resolves.toEqual(poll);
    expect(repository.removeVote).toHaveBeenCalledWith('p1', 'u1');
  });

  it.each<VoteChange>(['cast', 'moved'])('logs a %s vote', async (change) => {
    const repository = mock<PollRepository>();
    repository.setVote.mockResolvedValue(change);
    repository.getPoll.mockResolvedValue(aPoll());
    const log = spyOnLog();

    await new PollsService(repository).vote(user, 'p1', 'o1');

    expect(log).toHaveBeenCalledWith(`Poll vote poll=p1 change=${change}`);
  });

  it('logs a removed vote', async () => {
    const repository = mock<PollRepository>();
    repository.removeVote.mockResolvedValue('removed');
    repository.getPoll.mockResolvedValue(aPoll());
    const log = spyOnLog();

    await new PollsService(repository).removeVote(user, 'p1');

    expect(log).toHaveBeenCalledWith('Poll vote poll=p1 change=removed');
  });

  it('does not log a vote that changed nothing', async () => {
    const repository = mock<PollRepository>();
    repository.setVote.mockResolvedValue('unchanged');
    repository.removeVote.mockResolvedValue('unchanged');
    repository.getPoll.mockResolvedValue(aPoll());
    const log = spyOnLog();

    const service = new PollsService(repository);
    await service.vote(user, 'p1', 'o1');
    await service.removeVote(user, 'p1');

    expect(log).not.toHaveBeenCalled();
  });

  it.each([
    [
      'a poll that does not exist',
      new PollNotFoundError('p1'),
      new NotFoundException(POLL_NOT_FOUND_MESSAGE),
    ],
    [
      'a closed poll',
      new PollClosedError('p1'),
      new ConflictException(POLL_CLOSED_MESSAGE),
    ],
    [
      'an answer from another poll',
      new PollOptionNotFoundError('p1', 'o9'),
      new BadRequestException(OPTION_NOT_IN_POLL_MESSAGE),
    ],
  ])('rejects a vote on %s', async (_case, domainError, httpError) => {
    const repository = mock<PollRepository>();
    repository.setVote.mockRejectedValue(domainError);

    const service = new PollsService(repository);

    await expect(service.vote(user, 'p1', 'o9')).rejects.toEqual(httpError);
    expect(repository.getPoll).not.toHaveBeenCalled();
  });

  it('rejects removing a vote from a closed poll', async () => {
    const repository = mock<PollRepository>();
    repository.removeVote.mockRejectedValue(new PollClosedError('p1'));

    const service = new PollsService(repository);

    await expect(service.removeVote(user, 'p1')).rejects.toEqual(
      new ConflictException(POLL_CLOSED_MESSAGE),
    );
  });

  it('passes unexpected errors through unchanged', async () => {
    const failure = new Error('connection lost');
    const repository = mock<PollRepository>();
    repository.setVote.mockRejectedValue(failure);

    const service = new PollsService(repository);

    await expect(service.vote(user, 'p1', 'o1')).rejects.toBe(failure);
  });

  describe('closing', () => {
    it("closes the author's poll and returns it as they see it", async () => {
      const closed = aPoll({ closedAt: new Date('2026-01-02T12:00:00Z') });
      const repository = mock<PollRepository>();
      repository.getPoll.mockResolvedValue(closed);

      const service = new PollsService(repository);

      await expect(service.closePoll(user, 'p1')).resolves.toEqual(closed);
      expect(repository.closePoll).toHaveBeenCalledWith('p1', 'u1');
      expect(repository.getPoll).toHaveBeenCalledWith('p1', 'u1');
    });

    it.each([
      [
        'someone who is not the author',
        new PollNotAuthorError('p1'),
        new ForbiddenException(NOT_POLL_AUTHOR_MESSAGE),
      ],
      [
        'a poll that does not exist',
        new PollNotFoundError('p1'),
        new NotFoundException(POLL_NOT_FOUND_MESSAGE),
      ],
    ])('rejects closing by %s', async (_case, domainError, httpError) => {
      const repository = mock<PollRepository>();
      repository.closePoll.mockRejectedValue(domainError);

      const service = new PollsService(repository);

      await expect(service.closePoll(user, 'p1')).rejects.toEqual(httpError);
      expect(repository.getPoll).not.toHaveBeenCalled();
    });
  });
});
