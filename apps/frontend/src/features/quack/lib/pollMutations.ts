import type { QueryClient } from "@tanstack/react-query"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, Quack } from "@/features/quack/api/quackSchemas"

export const pollMutationScope = (pollId: string) => ({ id: `poll-${pollId}` })

export const updatePollInLists = (
  queryClient: QueryClient,
  pollId: string,
  update: (poll: Poll) => Poll,
) => {
  queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (quacks) =>
    quacks?.map((quack) =>
      quack.poll?.id === pollId ? { ...quack, poll: update(quack.poll) } : quack,
    ),
  )
}
