import type { Poll } from "@/features/quack/api/quackSchemas"

export function withVote(poll: Poll, optionId: string | null): Poll {
  const options = poll.options.map((option) => {
    const isPreviousPick = option.id === poll.myOptionId
    const isNewPick = option.id === optionId
    return { ...option, votes: option.votes - Number(isPreviousPick) + Number(isNewPick) }
  })
  return {
    ...poll,
    options,
    totalVotes: options.reduce((total, option) => total + option.votes, 0),
    myOptionId: optionId,
  }
}
