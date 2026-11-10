import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { screen } from "@testing-library/react"
import ky, { type HTTPError } from "ky"
import { describe, expect, it } from "vitest"

import { renderWithRouter } from "@/test/renderWithRouter"

import type { DeletedQuack, LiveQuack, QuackThread } from "@/features/quack/api/quackSchemas"
import { QuackThreadView } from "@/features/quack/components/QuackThreadView"

const liveQuack = (overrides: Partial<LiveQuack> = {}): LiveQuack => ({
  id: "q1",
  text: "the original quack",
  mood: null,
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  poll: null,
  isDeleted: false,
  replyingTo: null,
  replyCount: 0,
  canDelete: false,
  ...overrides,
})

const deletedQuack: DeletedQuack = {
  id: "q1",
  text: "",
  mood: null,
  userId: null,
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: null,
  poll: null,
  isDeleted: true,
  replyingTo: null,
  replyCount: 1,
  canDelete: false,
}

const aReply = liveQuack({
  id: "r1",
  text: "a reply",
  userId: "u2",
  user: { id: "u2", name: "The Bread Critic", username: "BreadCritic" },
  replyingTo: { quackId: "q1", username: "CaffeinatedDuck" },
})

const renderThread = (props: Parameters<typeof QuackThreadView>[0]) =>
  renderWithRouter(
    <QueryClientProvider client={new QueryClient()}>
      <QuackThreadView {...props} />
    </QueryClientProvider>,
  )

const httpError = async (status: number): Promise<HTTPError> => {
  const fail = ky.create({
    retry: { limit: 0 },
    fetch: () => Promise.resolve(new Response(null, { status })),
  })
  return fail.get("http://localhost/quacks/q1").then(
    () => {
      throw new Error("expected the request to fail")
    },
    (error: HTTPError) => error,
  )
}

describe("QuackThreadView", () => {
  it("shows the quack, a reply box and its replies", async () => {
    const thread: QuackThread = { quack: liveQuack({ replyCount: 1 }), replies: [aReply] }
    await renderThread({ thread })

    expect(screen.getByText("the original quack")).toBeInTheDocument()
    expect(screen.getByLabelText("Your reply")).toBeInTheDocument()
    expect(screen.getByText("a reply")).toBeInTheDocument()
    expect(screen.queryByText(/Replying to/)).not.toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "1 reply" })).not.toBeInTheDocument()
  })

  it("links up to the parent when the quack is itself a reply", async () => {
    const thread: QuackThread = {
      quack: liveQuack({ replyingTo: { quackId: "q0", username: "PondAdmin" } }),
      replies: [],
    }
    await renderThread({ thread })

    expect(screen.getByRole("link", { name: "@PondAdmin" })).toHaveAttribute("href", "/quacks/q0")
  })

  it("says when there are no replies yet", async () => {
    await renderThread({ thread: { quack: liveQuack(), replies: [] } })

    expect(screen.getByText("No replies yet. Be the first to reply.")).toBeInTheDocument()
  })

  it("shows a deleted quack as a placeholder with its replies and no reply box", async () => {
    await renderThread({ thread: { quack: deletedQuack, replies: [aReply] } })

    expect(screen.getByText("This quack was deleted.")).toBeInTheDocument()
    expect(screen.getByText("a reply")).toBeInTheDocument()
    expect(screen.queryByLabelText("Your reply")).not.toBeInTheDocument()
  })

  it("says the quack does not exist when the server answers 404", async () => {
    await renderThread({ error: await httpError(404) })

    expect(screen.getByText("This quack doesn't exist, or it was deleted.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to all quacks" })).toHaveAttribute(
      "href",
      "/quacks",
    )
    expect(screen.queryByRole("button", { name: "Reload" })).not.toBeInTheDocument()
  })

  it("offers a retry for any other error", async () => {
    await renderThread({ error: new Error("Server unreachable"), onReload: () => undefined })

    expect(screen.getByText("Server unreachable")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reload" })).toBeInTheDocument()
  })
})
