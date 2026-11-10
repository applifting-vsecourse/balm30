import { useMutation, useQueryClient } from "@tanstack/react-query"

import { castVote, removeVote } from "@/features/quack/api/pollVote"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack, QuackThread } from "@/features/quack/api/quackSchemas"
import { pollMutationScope, updatePollInQuacks } from "@/features/quack/lib/pollMutations"
import { withVote } from "@/features/quack/lib/withVote"

export function useVote(pollId: string) {
  const queryClient = useQueryClient()
  const mutationKey = quackKeys.pollVote(pollId)
  const isLatestVote = () => queryClient.isMutating({ mutationKey }) === 1

  return useMutation({
    mutationKey,
    scope: pollMutationScope(pollId),
    mutationFn: (optionId: string | null) =>
      optionId ? castVote(pollId, optionId) : removeVote(pollId),
    onMutate: async (optionId) => {
      await queryClient.cancelQueries({ queryKey: quackKeys.all() })
      const snapshot = queryClient.getQueriesData<Quack[] | QuackThread>({
        queryKey: quackKeys.all(),
      })
      updatePollInQuacks(queryClient, pollId, (poll) => withVote(poll, optionId))
      return { snapshot }
    },
    onSuccess: (poll) => {
      if (isLatestVote()) {
        updatePollInQuacks(queryClient, pollId, () => poll)
      }
    },
    onError: (_error, _optionId, context) => {
      if (isLatestVote()) {
        context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
      }
    },
    onSettled: async () => {
      if (isLatestVote()) {
        await queryClient.invalidateQueries({ queryKey: quackKeys.all() })
      }
    },
  })
}
