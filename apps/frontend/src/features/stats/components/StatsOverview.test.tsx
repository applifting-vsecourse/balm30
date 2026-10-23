import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import type { Stats } from "@/features/stats/api/statsSchemas"
import { StatsOverview } from "@/features/stats/components/StatsOverview"

const stats: Stats = {
  users: 6,
  quacks: 1234,
  polls: 3,
  votes: 9,
  recentQuacks: 4,
  recentDays: 7,
}

const valueOf = (label: string) => screen.getByText(label).nextElementSibling?.textContent

describe("StatsOverview", () => {
  it("shows every number with its label", () => {
    render(<StatsOverview stats={stats} />)

    expect(valueOf("Users")).toBe("6")
    expect(valueOf("Quacks")).toBe("1,234")
    expect(valueOf("Quacks in the last 7 days")).toBe("4")
    expect(valueOf("Polls")).toBe("3")
    expect(valueOf("Votes")).toBe("9")
  })

  it("shows a spinner while loading", () => {
    render(<StatsOverview isLoading />)

    expect(screen.getByLabelText("Loading stats")).toBeInTheDocument()
    expect(screen.queryByText("Users")).not.toBeInTheDocument()
  })

  it("shows an error with a working reload button", async () => {
    const onReload = vi.fn()
    render(
      <StatsOverview
        error={new Error("Forbidden")}
        onReload={onReload}
      />,
    )

    expect(screen.getByText("Couldn't load stats")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /reload/i }))
    expect(onReload).toHaveBeenCalledOnce()
  })
})
