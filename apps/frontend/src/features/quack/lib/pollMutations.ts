import type { QueryClient } from "@tanstack/react-query"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, Quack, QuackThread } from "@/features/quack/api/quackSchemas"

export const pollMutationScope = (pollId: string) => ({ id: `poll-${pollId}` })

const withUpdatedPoll =
  (pollId: string, update: (poll: Poll) => Poll) =>
  (quack: Quack): Quack =>
    !quack.isDeleted && quack.poll?.id === pollId ? { ...quack, poll: update(quack.poll) } : quack

export const updatePollInQuacks = (
  queryClient: QueryClient,
  pollId: string,
  update: (poll: Poll) => Poll,
) => {
  const updateQuack = withUpdatedPoll(pollId, update)
  queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (quacks) =>
    quacks?.map(updateQuack),
  )
  queryClient.setQueriesData<QuackThread>({ queryKey: quackKeys.threads() }, (thread) =>
    thread
      ? { quack: updateQuack(thread.quack), replies: thread.replies.map(updateQuack) }
      : thread,
  )
}
