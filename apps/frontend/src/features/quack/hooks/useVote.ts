import { useMutation, useQueryClient } from "@tanstack/react-query"

import { castVote, removeVote } from "@/features/quack/api/pollVote"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"
import { pollMutationScope, updatePollInLists } from "@/features/quack/lib/pollMutations"
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
      await queryClient.cancelQueries({ queryKey: quackKeys.lists() })
      const snapshot = queryClient.getQueriesData<Quack[]>({ queryKey: quackKeys.lists() })
      updatePollInLists(queryClient, pollId, (poll) => withVote(poll, optionId))
      return { snapshot }
    },
    onSuccess: (poll) => {
      if (isLatestVote()) {
        updatePollInLists(queryClient, pollId, () => poll)
      }
    },
    onError: (_error, _optionId, context) => {
      if (isLatestVote()) {
        context?.snapshot.forEach(([queryKey, quacks]) =>
          queryClient.setQueryData(queryKey, quacks),
        )
      }
    },
    onSettled: async () => {
      if (isLatestVote()) {
        await queryClient.invalidateQueries({ queryKey: quackKeys.lists() })
      }
    },
  })
}
