import type { QuackScope, QuackSort } from "@/features/quack/api/quackSchemas"

export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: () => [...quackKeys.all(), "list"] as const,
  list: (search: string, scope: QuackScope = "all", sort: QuackSort = "newest") =>
    [...quackKeys.lists(), { search, scope, sort }] as const,
  threads: () => [...quackKeys.all(), "thread"] as const,
  thread: (quackId: string) => [...quackKeys.threads(), quackId] as const,
  delete: (quackId: string) => [...quackKeys.all(), quackId, "delete"] as const,
  pollVote: (pollId: string) => [...quackKeys.all(), "poll", pollId, "vote"] as const,
  like: (quackId: string) => [...quackKeys.all(), quackId, "like"] as const,
  pollClose: (pollId: string) => [...quackKeys.all(), "poll", pollId, "close"] as const,
}
