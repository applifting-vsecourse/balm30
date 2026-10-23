import type { QuackScope } from "@/features/quack/api/quackSchemas"

export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: () => [...quackKeys.all(), "list"] as const,
  list: (search: string, scope: QuackScope = "all") =>
    [...quackKeys.lists(), { search, scope }] as const,
  delete: (quackId: string) => [...quackKeys.all(), quackId, "delete"] as const,
  pollVote: (pollId: string) => [...quackKeys.all(), "poll", pollId, "vote"] as const,
  pollClose: (pollId: string) => [...quackKeys.all(), "poll", pollId, "close"] as const,
}
