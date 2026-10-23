import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { deleteQuack } from "@/features/quack/api/deleteQuack"
import { quackKeys } from "@/features/quack/api/quackKeys"
import type { Quack } from "@/features/quack/api/quackSchemas"
import { QuackList } from "@/features/quack/components/QuackList"

vi.mock("@/features/quack/api/deleteQuack", () => ({ deleteQuack: vi.fn() }))

const quack = (overrides: Partial<Quack> = {}): Quack => ({
  id: "q1",
  text: "my own quack",
  mood: null,
  userId: "u1",
  createdAt: new Date("2026-01-01T12:00:00Z"),
  user: { id: "u1", name: "Caffeinated Duck", username: "CaffeinatedDuck" },
  poll: null,
  canDelete: true,
  ...overrides,
})

const someoneElsesQuack = quack({
  id: "q2",
  text: "someone else's quack",
  userId: "u2",
  user: { id: "u2", name: "Deep Duck Thoughts", username: "DeepDuckThoughts" },
  canDelete: false,
})

function Feed({ viewerId }: { viewerId: string }) {
  const { data } = useQuery({
    queryKey: quackKeys.list(""),
    queryFn: (): Quack[] => [],
    enabled: false,
  })
  return (
    <QuackList
      quacks={data ?? []}
      viewerId={viewerId}
    />
  )
}

const renderFeed = (quacks: Quack[], viewerId = "u1") => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(quackKeys.list(""), quacks)
  render(
    <QueryClientProvider client={queryClient}>
      <Feed viewerId={viewerId} />
    </QueryClientProvider>,
  )
}

const openDeleteDialog = () => userEvent.click(screen.getByRole("button", { name: "Delete quack" }))

const confirmDelete = () =>
  userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }))

describe("DeleteQuackButton", () => {
  beforeEach(() => {
    vi.mocked(deleteQuack).mockReset()
  })

  it("offers delete only on my own quacks", () => {
    renderFeed([quack(), someoneElsesQuack])

    expect(screen.getAllByRole("button", { name: "Delete quack" })).toHaveLength(1)
  })

  it("asks before deleting and keeps the quack when I back out", async () => {
    renderFeed([quack()])

    await openDeleteDialog()
    expect(screen.getByRole("alertdialog", { name: "Delete this quack?" })).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Keep it" }))

    expect(deleteQuack).not.toHaveBeenCalled()
    expect(screen.getByText("my own quack")).toBeInTheDocument()
  })

  it("removes the quack from the feed once deleted", async () => {
    vi.mocked(deleteQuack).mockResolvedValue()
    renderFeed([quack(), someoneElsesQuack])

    await openDeleteDialog()
    await confirmDelete()

    expect(deleteQuack).toHaveBeenCalledWith("q1")
    await waitFor(() => expect(screen.queryByText("my own quack")).not.toBeInTheDocument())
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    expect(screen.getByText("someone else's quack")).toBeInTheDocument()
  })

  it("keeps the dialog open with the error when deleting fails", async () => {
    vi.mocked(deleteQuack).mockRejectedValue(new Error("Only the author can delete this quack"))
    renderFeed([quack()])

    await openDeleteDialog()
    await confirmDelete()

    expect(await screen.findByText("Only the author can delete this quack")).toBeInTheDocument()
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()
    expect(screen.getByText("my own quack")).toBeInTheDocument()
  })

  describe("as a moderator", () => {
    const moderatorsView = [{ ...someoneElsesQuack, canDelete: true }]

    it("names the author of someone else's quack before deleting it", async () => {
      renderFeed(moderatorsView, "admin1")

      await openDeleteDialog()

      expect(
        screen.getByRole("alertdialog", { name: "Delete @DeepDuckThoughts's quack?" }),
      ).toBeInTheDocument()
      expect(screen.getByText(/You're deleting it as a moderator/)).toBeInTheDocument()
    })

    it("deletes someone else's quack and removes it from the feed", async () => {
      vi.mocked(deleteQuack).mockResolvedValue()
      renderFeed(moderatorsView, "admin1")

      await openDeleteDialog()
      await confirmDelete()

      expect(deleteQuack).toHaveBeenCalledWith("q2")
      await waitFor(() =>
        expect(screen.queryByText("someone else's quack")).not.toBeInTheDocument(),
      )
    })

    it("asks the usual question about their own quack", async () => {
      renderFeed([quack({ userId: "admin1" })], "admin1")

      await openDeleteDialog()

      expect(screen.getByRole("alertdialog", { name: "Delete this quack?" })).toBeInTheDocument()
      expect(screen.queryByText(/as a moderator/)).not.toBeInTheDocument()
    })
  })
})
