import { PrismaService } from '@/core/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import {
  Poll,
  PollClosedError,
  PollNotFoundError,
  PollOptionNotFoundError,
  VoteChange,
} from '@/modules/quack/domain/poll';
import { Injectable } from '@nestjs/common';
import { mapPrismaPollToDomain, pollIncludeFor } from './prisma-poll';

const lockOpenPoll = async (
  tx: Prisma.TransactionClient,
  pollId: string,
): Promise<void> => {
  const [poll] = await tx.$queryRaw<{ closedAt: Date | null }[]>`
    SELECT "closedAt" FROM "poll" WHERE "id" = ${pollId} FOR UPDATE
  `;
  if (!poll) {
    throw new PollNotFoundError(pollId);
  }
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
    return mapPrismaPollToDomain(poll);
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
