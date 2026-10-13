import { describe, expect, it } from "vitest"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { withVote } from "@/features/quack/lib/withVote"

const poll = (myOptionId: string | null, votes: [number, number]): Poll => ({
  id: "p1",
  question: "Lunch?",
  closedAt: null,
  options: [
    { id: "o1", text: "Pizza", votes: votes[0] },
    { id: "o2", text: "Soup", votes: votes[1] },
  ],
  totalVotes: votes[0] + votes[1],
  myOptionId,
})

describe("withVote", () => {
  it("adds a first vote", () => {
    expect(withVote(poll(null, [2, 1]), "o2")).toEqual(poll("o2", [2, 2]))
  })

  it("moves a vote", () => {
    expect(withVote(poll("o1", [2, 1]), "o2")).toEqual(poll("o2", [1, 2]))
  })

  it("removes a vote", () => {
    expect(withVote(poll("o1", [2, 1]), null)).toEqual(poll(null, [1, 1]))
  })

  it("changes nothing when voting for the same answer", () => {
    expect(withVote(poll("o1", [2, 1]), "o1")).toEqual(poll("o1", [2, 1]))
  })
})
