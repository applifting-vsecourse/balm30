import { PrismaService } from '@/core/prisma/prisma.service';
import { User } from '@/generated/prisma/client';

type CreatePollParams = {
  text: string;
  userId: string;
  createdAt?: Date;
  question: string;
  options: string[];
  votes: { voter: User; optionIndex: number }[];
};

export async function createPoll(
  prisma: PrismaService,
  params: CreatePollParams,
): Promise<void> {
  const { text, userId, createdAt, question, options, votes } = params;

  const poll = await prisma.poll.create({
    data: {
      question,
      createdAt,
      quack: { create: { text, createdAt, userId } },
      options: {
        create: options.map((optionText, position) => ({
          text: optionText,
          position,
        })),
      },
    },
    include: { options: { orderBy: { position: 'asc' } } },
  });

  await prisma.pollVote.createMany({
    data: votes.map(({ voter, optionIndex }) => ({
      pollId: poll.id,
      optionId: poll.options[optionIndex].id,
      userId: voter.id,
    })),
  });
}
