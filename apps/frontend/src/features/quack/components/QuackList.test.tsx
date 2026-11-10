// Example component test — the pattern to copy for your own components.
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithRouter } from "@/test/renderWithRouter"

import type { DeletedQuack, LiveQuack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

const quack = (overrides: Partial<LiveQuack> = {}): LiveQuack => ({
  id: "q1",
  text: "quack quack",
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

describe("QuackList", () => {
  it("renders quacks with author info", async () => {
    await renderWithRouter(<QuackList quacks={[quack()]} />)

    expect(screen.getByText("quack quack")).toBeInTheDocument()
    expect(screen.getByText("Caffeinated Duck")).toBeInTheDocument()
    expect(screen.getByText("@CaffeinatedDuck")).toBeInTheDocument()
  })

  it("shows the mood of a quack that has one", async () => {
    await renderWithRouter(<QuackList quacks={[quack({ mood: "silly" })]} />)

    expect(screen.getByText("Silly")).toBeInTheDocument()
  })

  it("shows no mood for a quack without one", async () => {
    await renderWithRouter(<QuackList quacks={[quack()]} />)

    for (const label of ["Happy", "Sad", "Angry", "Silly"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
  })

  it("says when no quack matches the search", async () => {
    await renderWithRouter(
      <QuackList
        quacks={[]}
        search="pond"
      />,
    )

    expect(screen.getByText("No quacks match “pond”.")).toBeInTheDocument()
  })

  it("shows an error with a working reload button", async () => {
    const onReload = vi.fn()
    await renderWithRouter(
      <QuackList
        quacks={[]}
        error={new Error("Server unreachable")}
        onReload={onReload}
      />,
    )

    expect(screen.getByText("Couldn't load quacks")).toBeInTheDocument()
    expect(screen.getByText("Server unreachable")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /reload/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })
  it("offers to write the first quack when I have none", async () => {
    const onWriteFirst = vi.fn()
    await renderWithRouter(
      <QuackList
        quacks={[]}
        scope="mine"
        onWriteFirst={onWriteFirst}
      />,
    )

    expect(screen.getByText("You haven't posted any quacks yet.")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Write your first quack" }))
    expect(onWriteFirst).toHaveBeenCalledOnce()
  })

  it("says when none of my quacks match the search", async () => {
    await renderWithRouter(
      <QuackList
        quacks={[]}
        scope="mine"
        search="pond"
      />,
    )

    expect(screen.getByText("None of your quacks match “pond”.")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Write your first quack" })).not.toBeInTheDocument()
  })

  describe("replies", () => {
    const deletedQuack = (overrides: Partial<DeletedQuack> = {}): DeletedQuack => ({
      id: "q9",
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
      ...overrides,
    })

    it("says whom a reply answers and links to the parent", async () => {
      await renderWithRouter(
        <QuackList quacks={[quack({ replyingTo: { quackId: "q0", username: "BreadCritic" } })]} />,
      )

      expect(screen.getByRole("link", { name: "@BreadCritic" })).toHaveAttribute(
        "href",
        "/quacks/q0",
      )
    })

    it("says when the parent was deleted", async () => {
      await renderWithRouter(
        <QuackList quacks={[quack({ replyingTo: { quackId: "q0", username: null } })]} />,
      )

      expect(screen.getByRole("link", { name: "a deleted quack" })).toHaveAttribute(
        "href",
        "/quacks/q0",
      )
    })

    it("hides whom a reply answers where that is obvious", async () => {
      await renderWithRouter(
        <QuackList
          quacks={[quack({ replyingTo: { quackId: "q0", username: "BreadCritic" } })]}
          shouldShowReplyingTo={false}
        />,
      )

      expect(screen.queryByText(/Replying to/)).not.toBeInTheDocument()
    })

    it.each([
      [0, "Reply"],
      [1, "1 reply"],
      [3, "3 replies"],
    ])("links a quack with %i replies to its thread as %j", async (replyCount, label) => {
      await renderWithRouter(<QuackList quacks={[quack({ replyCount })]} />)

      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/quacks/q1")
    })

    it("shows a deleted quack as a placeholder without its author", async () => {
      await renderWithRouter(<QuackList quacks={[deletedQuack()]} />)

      expect(screen.getByText("This quack was deleted.")).toBeInTheDocument()
      expect(screen.queryByText(/@/)).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: "Delete quack" })).not.toBeInTheDocument()
      expect(screen.getByRole("link", { name: "1 reply" })).toHaveAttribute("href", "/quacks/q9")
    })

    it("shows the empty text it is given", async () => {
      await renderWithRouter(
        <QuackList
          quacks={[]}
          emptyText="No replies yet. Be the first to reply."
        />,
      )

      expect(screen.getByText("No replies yet. Be the first to reply.")).toBeInTheDocument()
    })
  })
})
