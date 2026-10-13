export const quackKeys = {
  all: () => ["quacks"] as const,
  lists: () => [...quackKeys.all(), "list"] as const,
  list: (search: string) => [...quackKeys.lists(), { search }] as const,
  pollVote: (pollId: string) => [...quackKeys.all(), "poll", pollId, "vote"] as const,
  pollClose: (pollId: string) => [...quackKeys.all(), "poll", pollId, "close"] as const,
}
