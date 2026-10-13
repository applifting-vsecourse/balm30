import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Mood } from "@/lib/mood"

import { addQuack } from "@/features/quack/api/addQuack"
import { QuackForm } from "@/features/quack/components/QuackForm"

vi.mock("@/features/quack/api/addQuack", () => ({ addQuack: vi.fn() }))

const renderForm = (defaultMood?: Mood | null) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <QuackForm defaultMood={defaultMood} />
    </QueryClientProvider>,
  )

const fill = async (label: string, value: string) => {
  const field = screen.getByLabelText(label)
  await userEvent.clear(field)
  await userEvent.click(field)
  await userEvent.paste(value)
}

const addPoll = () => userEvent.click(screen.getByRole("button", { name: "Add poll" }))

const submit = () => userEvent.click(screen.getByRole("button", { name: "Quack" }))

const sentQuack = () => vi.mocked(addQuack).mock.calls[0]?.[0]

describe("QuackForm", () => {
  beforeEach(() => {
    vi.mocked(addQuack).mockReset()
    vi.mocked(addQuack).mockResolvedValue({} as Awaited<ReturnType<typeof addQuack>>)
  })

  it("starts with the user's default mood selected", () => {
    renderForm("silly")

    expect(screen.getByRole("combobox", { name: "Mood" })).toHaveTextContent("Silly")
  })

  it("starts with no mood when the user has no default", () => {
    renderForm(null)

    expect(screen.getByRole("combobox", { name: "Mood" })).toHaveTextContent("No mood")
  })

  it("still needs text when there is no poll", async () => {
    renderForm()

    await submit()

    expect(await screen.findByText("Write something first")).toBeInTheDocument()
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("posts a poll without text", async () => {
    renderForm()

    await addPoll()
    await fill("Question", " Where do we go for lunch? ")
    await fill("Answer 1", "Pizza")
    await fill("Answer 2", " Soup")
    await submit()

    await waitFor(() => expect(addQuack).toHaveBeenCalledOnce())
    expect(sentQuack()).toEqual({
      text: "",
      mood: null,
      poll: { question: "Where do we go for lunch?", options: ["Pizza", "Soup"] },
    })
  })

  it("posts no poll after it is removed", async () => {
    renderForm()

    await addPoll()
    await userEvent.click(screen.getByRole("button", { name: "Remove poll" }))
    await fill("New quack", "just a quack")
    await submit()

    await waitFor(() => expect(addQuack).toHaveBeenCalledOnce())
    expect(sentQuack()).toEqual({ text: "just a quack", mood: null, poll: null })
  })

  it("starts with two answers and allows two to four", async () => {
    renderForm()

    await addPoll()
    expect(screen.queryByRole("button", { name: /Remove answer/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Add answer" }))
    await userEvent.click(screen.getByRole("button", { name: "Add answer" }))

    expect(screen.getByLabelText("Answer 4")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Add answer" })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Remove answer 4" }))
    await userEvent.click(screen.getByRole("button", { name: "Remove answer 3" }))

    expect(screen.queryByLabelText("Answer 3")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Remove answer/ })).not.toBeInTheDocument()
  })

  it("needs a question and every answer filled in", async () => {
    renderForm()

    await addPoll()
    await fill("Answer 1", "Pizza")
    await submit()

    expect(await screen.findByText("Ask a question")).toBeInTheDocument()
    expect(screen.getByText("Fill in this answer")).toBeInTheDocument()
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("rejects the same answer twice, ignoring case", async () => {
    renderForm()

    await addPoll()
    await fill("Question", "Lunch?")
    await fill("Answer 1", "Pizza")
    await fill("Answer 2", "pizza ")
    await submit()

    expect(await screen.findByText("Each answer must be different")).toBeInTheDocument()
    expect(addQuack).not.toHaveBeenCalled()
  })

  it("keeps the question and answers within their limits", async () => {
    renderForm()

    await addPoll()
    await fill("Question", "q".repeat(141))
    await fill("Answer 1", "a".repeat(51))
    await fill("Answer 2", "Soup")
    await submit()

    expect(await screen.findByText("Keep it under 140 characters")).toBeInTheDocument()
    expect(screen.getByText("Keep it under 50 characters")).toBeInTheDocument()
    expect(addQuack).not.toHaveBeenCalled()
  })
})
