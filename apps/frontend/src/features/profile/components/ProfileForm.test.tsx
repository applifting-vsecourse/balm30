import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { HTTPError } from "@/lib/api-client"

import type { Profile } from "@/features/profile/api/profileSchemas"
import { updateProfile } from "@/features/profile/api/updateProfile"
import { ProfileForm } from "@/features/profile/components/ProfileForm"

vi.mock("@/features/profile/api/updateProfile", () => ({ updateProfile: vi.fn() }))
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }))

const profile: Profile = {
  username: "CaffeinatedDuck",
  name: "Caffeinated Duck",
  bio: "Runs on espresso",
  defaultMood: null,
}

const conflict = () =>
  new HTTPError(
    new Response(null, { status: 409 }),
    new Request("http://localhost/api/profile", { method: "PUT" }),
    {} as ConstructorParameters<typeof HTTPError>[2],
  )

const renderForm = (onSaved = vi.fn()) => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <ProfileForm
        profile={profile}
        onSaved={onSaved}
      />
    </QueryClientProvider>,
  )
  return { onSaved }
}

const usernameField = () => screen.getByLabelText("Username")

const replaceValue = async (field: HTMLElement, value: string) => {
  await userEvent.clear(field)
  await userEvent.click(field)
  await userEvent.paste(value)
}

const replaceUsername = (value: string) => replaceValue(usernameField(), value)

const save = () => userEvent.click(screen.getByRole("button", { name: "Save changes" }))

describe("ProfileForm", () => {
  beforeEach(() => {
    vi.mocked(updateProfile).mockReset()
    vi.mocked(toast.success).mockReset()
  })

  it("starts with the saved profile", () => {
    renderForm()

    expect(usernameField()).toHaveValue("CaffeinatedDuck")
    expect(screen.getByLabelText("Display name")).toHaveValue("Caffeinated Duck")
    expect(screen.getByLabelText("Bio")).toHaveValue("Runs on espresso")
  })

  it.each([
    ["ab", "Use at least 3 characters"],
    ["a".repeat(31), "Use at most 30 characters"],
    ["duck!", "Use only letters, numbers, dots and underscores"],
  ])("rejects the username %j before saving", async (username, message) => {
    renderForm()

    await replaceUsername(username)
    await save()

    expect(await screen.findByText(message)).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it("requires a display name and keeps the bio short", async () => {
    renderForm()

    await userEvent.clear(screen.getByLabelText("Display name"))
    await replaceValue(screen.getByLabelText("Bio"), "q".repeat(161))
    await save()

    expect(await screen.findByText("Display name is required")).toBeInTheDocument()
    expect(screen.getByText("Keep it under 160 characters")).toBeInTheDocument()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it("saves the changes and confirms it", async () => {
    const saved: Profile = { ...profile, username: "Espresso.Duck", bio: null }
    vi.mocked(updateProfile).mockResolvedValue(saved)
    const { onSaved } = renderForm()

    await replaceUsername("Espresso.Duck")
    await userEvent.clear(screen.getByLabelText("Bio"))
    await save()

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Settings saved"))
    expect(vi.mocked(updateProfile).mock.calls[0]?.[0]).toEqual({
      username: "Espresso.Duck",
      name: "Caffeinated Duck",
      bio: null,
      defaultMood: null,
    })
    expect(onSaved).toHaveBeenCalledOnce()
  })

  it("says next to the field when the username is taken and keeps what was typed", async () => {
    vi.mocked(updateProfile).mockRejectedValue(conflict())
    renderForm()

    await replaceUsername("BreadCritic")
    await save()

    expect(await screen.findByText("That username is already taken")).toBeInTheDocument()
    expect(usernameField()).toHaveValue("BreadCritic")
    expect(usernameField()).toHaveAttribute("aria-invalid", "true")
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("discards unsaved changes", async () => {
    renderForm()

    await replaceUsername("SomethingElse")
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }))

    expect(usernameField()).toHaveValue("CaffeinatedDuck")
  })

  it("discards back to what was last saved", async () => {
    vi.mocked(updateProfile).mockResolvedValue({ ...profile, username: "Espresso.Duck" })
    renderForm()

    await replaceUsername("Espresso.Duck")
    await save()
    await waitFor(() => expect(toast.success).toHaveBeenCalled())
    await replaceUsername("Decaf.Duck")
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }))

    expect(usernameField()).toHaveValue("Espresso.Duck")
  })
})
