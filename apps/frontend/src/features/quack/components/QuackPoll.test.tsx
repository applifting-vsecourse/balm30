import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { castVote, removeVote } from "@/features/quack/api/pollVote"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Poll, Quack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

vi.mock("@/features/quack/api/pollVote", () => ({ castVote: vi.fn(), removeVote: vi.fn() }))

const poll = (overrides: Partial<Poll> = {}): Poll => ({
  id: "p1",
  question: "Where do we go for lunch?",
  closedAt: null,
  options: [
    { id: "o1", text: "Pizza", votes: 2 },
    { id: "o2", text: "Soup", votes: 1 },
  ],
  totalVotes: 3,
  myOptionId: null,
  ...overrides,
})

const pollQuack = (overrides: Partial<Poll> = {}): Quack => ({
  id: "q1",
  text: "",
  mood: null,
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Pond Admin", username: "PondAdmin" },
  poll: poll(overrides),
})

function Feed() {
  const { data } = useQuery({
    queryKey: quackKeys.list(""),
    queryFn: (): Quack[] => [],
    enabled: false,
  })
  return <QuackList quacks={data ?? []} />
}

const renderFeed = (overrides: Partial<Poll> = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(quackKeys.list(""), [pollQuack(overrides)])
  render(
    <QueryClientProvider client={queryClient}>
      <Feed />
    </QueryClientProvider>,
  )
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const neverAnswers = () => deferred<Poll>().promise

const answer = (text: string) => screen.getByRole("button", { name: new RegExp(`^${text}`) })

const expectAnswer = (text: string, counts: string, isMine: boolean) => {
  expect(within(answer(text)).getByText(counts)).toBeInTheDocument()
  expect(answer(text)).toHaveAttribute("aria-pressed", String(isMine))
}

describe("QuackPoll", () => {
  beforeEach(() => {
    vi.mocked(castVote).mockReset()
    vi.mocked(removeVote).mockReset()
  })

  it("shows every answer's count, percentage and the total, in order", () => {
    renderFeed()

    expect(screen.getByText("Where do we go for lunch?")).toBeInTheDocument()
    const answers = within(screen.getByRole("list", { name: "Answers" })).getAllByRole("button")
    expect(answers.map((button) => button.textContent)).toEqual(["Pizza2 · 67%", "Soup1 · 33%"])
    expect(screen.getByText("3 votes")).toBeInTheDocument()
  })

  it("shows 0% everywhere before anyone votes", () => {
    renderFeed({
      options: [
        { id: "o1", text: "Pizza", votes: 0 },
        { id: "o2", text: "Soup", votes: 0 },
      ],
      totalVotes: 0,
    })

    expectAnswer("Pizza", "0 · 0%", false)
    expect(screen.getByText("0 votes")).toBeInTheDocument()
  })

  it("marks my answer", () => {
    renderFeed({ myOptionId: "o2" })

    expectAnswer("Soup", "1 · 33%", true)
    expectAnswer("Pizza", "2 · 67%", false)
  })

  it("counts my vote straight away, then shows the server's numbers", async () => {
    const request = deferred<Poll>()
    vi.mocked(castVote).mockReturnValue(request.promise)
    renderFeed()

    await userEvent.click(answer("Soup"))

    expectAnswer("Soup", "2 · 50%", true)
    expect(screen.getByText("4 votes")).toBeInTheDocument()
    expect(castVote).toHaveBeenCalledWith("p1", "o2")

    request.resolve(
      poll({
        options: [
          { id: "o1", text: "Pizza", votes: 3 },
          { id: "o2", text: "Soup", votes: 2 },
        ],
        totalVotes: 5,
        myOptionId: "o2",
      }),
    )

    await waitFor(() => expect(screen.getByText("5 votes")).toBeInTheDocument())
    expectAnswer("Soup", "2 · 40%", true)
  })

  it("moves my vote to another answer", async () => {
    vi.mocked(castVote).mockReturnValue(neverAnswers())
    renderFeed({ myOptionId: "o1" })

    await userEvent.click(answer("Soup"))

    expectAnswer("Pizza", "1 · 33%", false)
    expectAnswer("Soup", "2 · 67%", true)
    expect(screen.getByText("3 votes")).toBeInTheDocument()
  })

  it("removes my vote when I click my own answer again", async () => {
    vi.mocked(removeVote).mockReturnValue(neverAnswers())
    renderFeed({ myOptionId: "o1" })

    await userEvent.click(answer("Pizza"))

    expect(removeVote).toHaveBeenCalledWith("p1")
    expect(castVote).not.toHaveBeenCalled()
    expectAnswer("Pizza", "1 · 50%", false)
    expect(screen.getByText("2 votes")).toBeInTheDocument()
  })

  it("puts the poll back and says so when a vote fails, and retries it", async () => {
    vi.mocked(castVote).mockRejectedValueOnce(new Error("This poll is closed"))
    renderFeed()

    await userEvent.click(answer("Soup"))

    expect(await screen.findByText("Your vote didn't go through")).toBeInTheDocument()
    expect(screen.getByText("This poll is closed")).toBeInTheDocument()
    expectAnswer("Soup", "1 · 33%", false)
    expect(screen.getByText("3 votes")).toBeInTheDocument()

    vi.mocked(castVote).mockReturnValue(neverAnswers())
    await userEvent.click(screen.getByRole("button", { name: "Retry" }))

    expect(castVote).toHaveBeenLastCalledWith("p1", "o2")
    expectAnswer("Soup", "2 · 50%", true)
    expect(screen.queryByText("Your vote didn't go through")).not.toBeInTheDocument()
  })

  it("keeps showing my latest click while an earlier vote is still answering", async () => {
    const first = deferred<Poll>()
    const second = deferred<Poll>()
    vi.mocked(castVote).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    renderFeed()

    await userEvent.click(answer("Pizza"))
    await userEvent.click(answer("Soup"))
    expectAnswer("Soup", "2 · 50%", true)

    first.resolve(
      poll({
        options: [
          { id: "o1", text: "Pizza", votes: 3 },
          { id: "o2", text: "Soup", votes: 1 },
        ],
        totalVotes: 4,
        myOptionId: "o1",
      }),
    )
    await waitFor(() => expect(castVote).toHaveBeenCalledTimes(2))
    expectAnswer("Soup", "2 · 50%", true)

    second.resolve(
      poll({
        options: [
          { id: "o1", text: "Pizza", votes: 2 },
          { id: "o2", text: "Soup", votes: 2 },
        ],
        totalVotes: 4,
        myOptionId: "o2",
      }),
    )
    await waitFor(() => expect(castVote).toHaveBeenLastCalledWith("p1", "o2"))
    expectAnswer("Soup", "2 · 50%", true)
    expectAnswer("Pizza", "2 · 50%", false)
  })

  it("sends votes for one poll one at a time", async () => {
    const first = deferred<Poll>()
    vi.mocked(castVote).mockReturnValueOnce(first.promise).mockReturnValue(neverAnswers())
    renderFeed()

    await userEvent.click(answer("Pizza"))
    await userEvent.click(answer("Soup"))

    expect(castVote).toHaveBeenCalledTimes(1)

    first.resolve(poll({ myOptionId: "o1" }))
    await waitFor(() => expect(castVote).toHaveBeenCalledTimes(2))
  })

  it("can't be voted on once closed", () => {
    renderFeed({ closedAt: new Date("2026-01-02T12:00:00Z") })

    expect(answer("Pizza")).toBeDisabled()
    expect(answer("Soup")).toBeDisabled()
  })
})
