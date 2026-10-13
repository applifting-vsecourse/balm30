import { api } from "@/lib/api-client"

import { pollSchema, type Poll } from "@/features/quack/api/quackSchemas"

export async function castVote(pollId: string, optionId: string): Promise<Poll> {
  const json = await api.put(`polls/${pollId}/vote`, { json: { optionId } }).json()
  return pollSchema.parse(json)
}

export async function removeVote(pollId: string): Promise<Poll> {
  const json = await api.delete(`polls/${pollId}/vote`).json()
  return pollSchema.parse(json)
}
