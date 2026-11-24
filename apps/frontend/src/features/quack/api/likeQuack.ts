import { api } from "@/lib/api-client"

import { likeStateSchema, type LikeState } from "@/features/quack/api/quackSchemas"

export async function likeQuack(quackId: string): Promise<LikeState> {
  const json = await api.post(`quacks/${quackId}/like`).json()
  return likeStateSchema.parse(json)
}

export async function unlikeQuack(quackId: string): Promise<LikeState> {
  const json = await api.delete(`quacks/${quackId}/like`).json()
  return likeStateSchema.parse(json)
}
