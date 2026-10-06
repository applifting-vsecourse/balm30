import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { QuackSearch } from "@/features/quack/components/QuackSearch"

const type = (text: string) =>
  fireEvent.change(screen.getByLabelText("Search quacks"), { target: { value: text } })

describe("QuackSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("reports the trimmed search once typing pauses", () => {
    const onSearchChange = vi.fn()
    render(
      <QuackSearch
        value=""
        onSearchChange={onSearchChange}
      />,
    )

    type("po")
    act(() => {
      vi.advanceTimersByTime(100)
    })
    type(" pond ")
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(onSearchChange).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("pond")
  })

  it("reports an empty search when the box is cleared", () => {
    const onSearchChange = vi.fn()
    render(
      <QuackSearch
        value="pond"
        onSearchChange={onSearchChange}
      />,
    )

    type("   ")
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith("")
  })

  it("follows a search that changes from outside", () => {
    const onSearchChange = vi.fn()
    const { rerender } = render(
      <QuackSearch
        value="pond"
        onSearchChange={onSearchChange}
      />,
    )
    expect(screen.getByLabelText("Search quacks")).toHaveValue("pond")

    rerender(
      <QuackSearch
        value="crumb"
        onSearchChange={onSearchChange}
      />,
    )
    expect(screen.getByLabelText("Search quacks")).toHaveValue("crumb")
    act(() => {
      vi.advanceTimersByTime(300)
    })
    expect(onSearchChange).not.toHaveBeenCalled()
  })

  it("keeps what is being typed when its own earlier search comes back", () => {
    const onSearchChange = vi.fn()
    const { rerender } = render(
      <QuackSearch
        value=""
        onSearchChange={onSearchChange}
      />,
    )

    type("pon")
    act(() => {
      vi.advanceTimersByTime(300)
    })
    type("pond")
    rerender(
      <QuackSearch
        value="pon"
        onSearchChange={onSearchChange}
      />,
    )

    expect(screen.getByLabelText("Search quacks")).toHaveValue("pond")
  })
})
