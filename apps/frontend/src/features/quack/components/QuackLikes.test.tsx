import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithRouter } from "@/test/renderWithRouter"

import { likeQuack, unlikeQuack } from "@/features/quack/api/likeQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { DeletedQuack, LikeState, LiveQuack, Quack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

vi.mock("@/features/quack/api/likeQuack", () => ({ likeQuack: vi.fn(), unlikeQuack: vi.fn() }))
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

const liveQuack = (likeCount: number, isLikedByMe: boolean) => {
  const quack: LiveQuack = {
    id: "q1",
    text: "Bread is a lifestyle",
    mood: null,
    userId: "u2",
    createdAt: new Date("2026-01-01T12:00:00Z"),
    user: { id: "u2", name: "Bread Critic", username: "BreadCritic" },
    poll: null,
    isDeleted: false,
    replyingTo: null,
    replyCount: 1,
    likeCount,
    likedByMe: isLikedByMe,
    canDelete: false,
  }
  return { ...quack, likeCount, likedByMe: isLikedByMe }
}

const deletedQuack = () => {
  const quack: DeletedQuack = {
    id: "q0",
    text: "",
    mood: null,
    userId: null,
    createdAt: new Date("2026-01-01T11:00:00Z"),
    user: null,
    poll: null,
    isDeleted: true,
    replyingTo: null,
    replyCount: 1,
    likeCount: null,
    likedByMe: null,
    canDelete: false,
  }
  return { ...quack, likeCount: null, likedByMe: null }
}

function Feed() {
  const { data } = useQuery({
    queryKey: quackKeys.list(""),
    queryFn: (): Quack[] => [],
    enabled: false,
  })
  return <QuackList quacks={data ?? []} />
}

const renderFeed = async (quacks: Quack[]) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(quackKeys.list(""), quacks)
  await renderWithRouter(
    <QueryClientProvider client={queryClient}>
      <Feed />
    </QueryClientProvider>,
  )
}

const neverAnswers = () => new Promise<LikeState>(() => undefined)

const likeButtonIn = (container: HTMLElement) =>
  within(container).queryByRole("button", { name: "Like" })

const expectLikeButton = (container: HTMLElement, count: string, isPressed: boolean) => {
  const button = likeButtonIn(container)
  expect(button).toBeInTheDocument()
  expect(button).toHaveTextContent(count)
  expect(button).toHaveAttribute("aria-pressed", String(isPressed))
}

describe("Like button", () => {
  beforeEach(() => {
    vi.mocked(likeQuack).mockReset()
    vi.mocked(unlikeQuack).mockReset()
    vi.mocked(toast.error).mockReset()
  })

  it("R14: shows the count and that I like the quack", async () => {
    await renderFeed([liveQuack(4, true)])

    expectLikeButton(screen.getByRole("article"), "4", true)
  })

  it("R15: shows a count of 0", async () => {
    await renderFeed([liveQuack(0, false)])

    expectLikeButton(screen.getByRole("article"), "0", false)
  })

  it("R16: counts my like straight away, before the server answers", async () => {
    vi.mocked(likeQuack).mockReturnValue(neverAnswers())
    await renderFeed([liveQuack(0, false)])
    const article = screen.getByRole("article")
    expectLikeButton(article, "0", false)

    await userEvent.click(likeButtonIn(article)!)

    expectLikeButton(article, "1", true)
    expect(likeQuack).toHaveBeenCalledWith("q1")
  })

  it("R17: puts the count back and shows an error toast when the like fails", async () => {
    vi.mocked(likeQuack).mockRejectedValue(new Error("Server is down"))
    await renderFeed([liveQuack(0, false)])
    const article = screen.getByRole("article")
    expectLikeButton(article, "0", false)

    await userEvent.click(likeButtonIn(article)!)

    await waitFor(() => expect(toast.error).toHaveBeenCalled())
    expectLikeButton(article, "0", false)
  })

  it("R18: a deleted quack has no like button, a live one next to it does", async () => {
    await renderFeed([liveQuack(2, false), deletedQuack()])
    const articles = screen.getAllByRole("article")
    const live = articles[0]!
    const deleted = articles[1]!

    expect(likeButtonIn(live)).toBeInTheDocument()
    expect(likeButtonIn(deleted)).not.toBeInTheDocument()
    expect(within(deleted).queryByText("2")).not.toBeInTheDocument()
  })
})
