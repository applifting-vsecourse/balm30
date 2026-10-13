import { api } from "@/lib/api-client"
import type { Mood } from "@/lib/mood"

import { quackSchema, type Quack } from "@/features/quack/api/quackSchemas"

export type NewPoll = { question: string; options: string[] }

export async function addQuack(input: {
  text: string
  mood: Mood | null
  poll: NewPoll | null
}): Promise<Quack> {
  const json = await api.post("quacks", { json: input }).json()
  return quackSchema.parse(json)
}
