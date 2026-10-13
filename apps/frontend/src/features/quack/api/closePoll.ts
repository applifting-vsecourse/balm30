import { api } from "@/lib/api-client"

import { pollSchema, type Poll } from "@/features/quack/api/quackSchemas"

export async function closePoll(pollId: string): Promise<Poll> {
  const json = await api.post(`polls/${pollId}/close`).json()
  return pollSchema.parse(json)
}
