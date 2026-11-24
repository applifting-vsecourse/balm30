import type { QueryClient } from "@tanstack/react-query"

import { quackKeys } from "@/features/quack/api/quackKeys"
import type { LikeState, Quack, QuackThread } from "@/features/quack/api/quackSchemas"

export const likeMutationScope = (quackId: string) => ({ id: `like-${quackId}` })

export function withLike(likeState: LikeState, isLiked: boolean): LikeState {
  if (likeState.likedByMe === isLiked) return likeState
  return { likeCount: likeState.likeCount + (isLiked ? 1 : -1), likedByMe: isLiked }
}

const withUpdatedLike =
  (quackId: string, update: (likeState: LikeState) => LikeState) =>
  (quack: Quack): Quack =>
    !quack.isDeleted && quack.id === quackId ? { ...quack, ...update(quack) } : quack

export const updateLikeInQuacks = (
  queryClient: QueryClient,
  quackId: string,
  update: (likeState: LikeState) => LikeState,
) => {
  const updateQuack = withUpdatedLike(quackId, update)
  queryClient.setQueriesData<Quack[]>({ queryKey: quackKeys.lists() }, (quacks) =>
    quacks?.map(updateQuack),
  )
  queryClient.setQueriesData<QuackThread>({ queryKey: quackKeys.threads() }, (thread) =>
    thread
      ? { quack: updateQuack(thread.quack), replies: thread.replies.map(updateQuack) }
      : thread,
  )
}
