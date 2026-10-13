import { Prisma } from '@/generated/prisma/client';
import { Poll } from '@/modules/quack/domain/poll';

export const pollIncludeFor = (viewerId: string) =>
  ({
    options: {
      orderBy: { position: 'asc' },
      include: { _count: { select: { votes: true } } },
    },
    votes: { where: { userId: viewerId }, select: { optionId: true } },
    quack: { select: { userId: true } },
  }) as const;

export type PrismaPollWithViewer = Prisma.PollGetPayload<{
  include: ReturnType<typeof pollIncludeFor>;
}>;

export const mapPrismaPollToDomain = (
  poll: PrismaPollWithViewer,
  viewerId: string,
): Poll => {
  const options = poll.options.map((option) => ({
    id: option.id,
    text: option.text,
    votes: option._count.votes,
  }));
  return {
    id: poll.id,
    question: poll.question,
    closedAt: poll.closedAt,
    options,
    totalVotes: options.reduce((total, option) => total + option.votes, 0),
    myOptionId: poll.votes[0]?.optionId ?? null,
    canClose: poll.closedAt === null && poll.quack.userId === viewerId,
  };
};
