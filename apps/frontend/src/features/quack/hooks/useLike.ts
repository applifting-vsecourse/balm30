import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { likeQuack, unlikeQuack } from "@/features/quack/api/likeQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack, QuackThread } from "@/features/quack/api/quackSchemas"
import { likeMutationScope, updateLikeInQuacks, withLike } from "@/features/quack/lib/likeMutations"

export function useLike(quackId: string) {
  const queryClient = useQueryClient()
  const mutationKey = quackKeys.like(quackId)
  const isLatestLike = () => queryClient.isMutating({ mutationKey }) === 1

  return useMutation({
    mutationKey,
    scope: likeMutationScope(quackId),
    mutationFn: (isLiked: boolean) => (isLiked ? likeQuack(quackId) : unlikeQuack(quackId)),
    onMutate: async (isLiked) => {
      await queryClient.cancelQueries({ queryKey: quackKeys.all() })
      const snapshot = queryClient.getQueriesData<Quack[] | QuackThread>({
        queryKey: quackKeys.all(),
      })
      updateLikeInQuacks(queryClient, quackId, (likeState) => withLike(likeState, isLiked))
      return { snapshot }
    },
    onSuccess: (likeState) => {
      if (isLatestLike()) {
        updateLikeInQuacks(queryClient, quackId, () => likeState)
      }
    },
    onError: (error, _variables: unknown, context) => {
      if (isLatestLike()) {
        context?.snapshot.forEach(([queryKey, data]) => queryClient.setQueryData(queryKey, data))
      }
      toast.error("Your like didn't go through", { description: error.message })
    },
    onSettled: async () => {
      if (isLatestLike()) {
        await queryClient.invalidateQueries({ queryKey: quackKeys.all() })
      }
    },
  })
}
