import { useMutation, useQueryClient } from "@tanstack/react-query"

import { closePoll } from "@/features/quack/api/closePoll"
import { quackKeys } from "@/features/quack/api/quackKeys"
import { pollMutationScope, updatePollInLists } from "@/features/quack/lib/pollMutations"

export function useClosePoll(pollId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationKey: quackKeys.pollClose(pollId),
    scope: pollMutationScope(pollId),
    mutationFn: () => closePoll(pollId),
    onSuccess: async (poll) => {
      updatePollInLists(queryClient, pollId, () => poll)
      await queryClient.invalidateQueries({ queryKey: quackKeys.lists() })
    },
  })
}
