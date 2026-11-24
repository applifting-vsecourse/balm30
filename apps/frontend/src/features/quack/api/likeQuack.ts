import type { LikeState } from "@/features/quack/api/quackSchemas"

export function likeQuack(_quackId: string): Promise<LikeState> {
  return Promise.reject(new Error("not implemented"))
}

export function unlikeQuack(_quackId: string): Promise<LikeState> {
  return Promise.reject(new Error("not implemented"))
}
