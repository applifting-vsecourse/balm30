import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api-client"

import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"

vi.mock("@/lib/api-client", () => ({ api: { get: vi.fn() } }))

describe("quacksQueryOptions", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset()
    vi.mocked(api.get).mockReturnValue({ json: () => Promise.resolve([]) } as unknown as ReturnType<
      typeof api.get
    >)
  })

  it("R19: asks for the most liked quacks and keeps the search and 'mine'", async () => {
    await new QueryClient().fetchQuery(quacksQueryOptions("pond", "mine", "likes"))

    expect(api.get).toHaveBeenCalledWith("quacks", {
      searchParams: { q: "pond", scope: "mine", sort: "likes" },
    })
  })

  it("R19: keeps a separate cache entry for each sort", () => {
    expect(quacksQueryOptions("pond", "mine", "likes").queryKey).not.toEqual(
      quacksQueryOptions("pond", "mine", "newest").queryKey,
    )
  })
})
