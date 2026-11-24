import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { QuackSort } from "@/features/quack/components/QuackSort"

describe("QuackSort", () => {
  it("R19: offers Newest and Most liked, and reports Most liked when chosen", async () => {
    const onSortChange = vi.fn()
    render(
      <QuackSort
        value="newest"
        onSortChange={onSortChange}
      />,
    )

    const mostLiked = screen.queryByRole("tab", { name: "Most liked" })
    expect(screen.queryByRole("tab", { name: "Newest" })).toHaveAttribute("aria-selected", "true")
    expect(mostLiked).toBeInTheDocument()

    await userEvent.click(mostLiked!)

    expect(onSortChange).toHaveBeenCalledExactlyOnceWith("likes")
  })
})
