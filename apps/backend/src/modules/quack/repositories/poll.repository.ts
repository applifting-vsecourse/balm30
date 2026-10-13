import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import {
  Poll,
  PollClosedError,
  PollNotAuthorError,
  PollNotFoundError,
  PollOptionNotFoundError,
  VoteChange,
} from '@/modules/quack/domain/poll';
import { Injectable } from '@nestjs/common';
import { mapPrismaPollToDomain, pollIncludeFor } from './prisma-poll';

type LockedPoll = { closedAt: Date | null; authorId: string };

const lockPoll = async (
  tx: Prisma.TransactionClient,
  pollId: string,
): Promise<LockedPoll> => {
  const [poll] = await tx.$queryRaw<LockedPoll[]>`
    SELECT "poll"."closedAt", "quack"."userId" AS "authorId"
    FROM "poll" JOIN "quack" ON "quack"."id" = "poll"."quackId"
    WHERE "poll"."id" = ${pollId}
    FOR UPDATE OF "poll"
  `;
  if (!poll) {
    throw new PollNotFoundError(pollId);
  }
  return poll;
};

const lockOpenPoll = async (
  tx: Prisma.TransactionClient,
  pollId: string,
): Promise<void> => {
  const poll = await lockPoll(tx, pollId);
  if (poll.closedAt) {
    throw new PollClosedError(pollId);
  }
};

@Injectable()
export class PollRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPoll(pollId: string, viewerId: string): Promise<Poll> {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: pollIncludeFor(viewerId),
    });
    if (!poll) {
      throw new PollNotFoundError(pollId);
    }
    return mapPrismaPollToDomain(poll, viewerId);
  }

  async setVote(
    pollId: string,
    userId: string,
    optionId: string,
  ): Promise<VoteChange> {
    return this.prisma.$transaction(async (tx) => {
      await lockOpenPoll(tx, pollId);

      const option = await tx.pollOption.findUnique({
        where: { id_pollId: { id: optionId, pollId } },
        select: { id: true },
      });
      if (!option) {
        throw new PollOptionNotFoundError(pollId, optionId);
      }

      const where = { pollId_userId: { pollId, userId } };
      const previous = await tx.pollVote.findUnique({ where });
      if (!previous) {
        await tx.pollVote.create({ data: { pollId, optionId, userId } });
        return 'cast';
      }
      if (previous.optionId === optionId) {
        return 'unchanged';
      }
      await tx.pollVote.update({ where, data: { optionId } });
      return 'moved';
    });
  }

  async closePoll(pollId: string, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const poll = await lockPoll(tx, pollId);
      if (poll.authorId !== userId) {
        throw new PollNotAuthorError(pollId);
      }
      if (!poll.closedAt) {
        await tx.poll.update({
          where: { id: pollId },
          data: { closedAt: new Date() },
        });
      }
    });
  }

  async removeVote(pollId: string, userId: string): Promise<VoteChange> {
    return this.prisma.$transaction(async (tx) => {
      await lockOpenPoll(tx, pollId);

      const { count } = await tx.pollVote.deleteMany({
        where: { pollId, userId },
      });
      return count > 0 ? 'removed' : 'unchanged';
    });
  }
}
