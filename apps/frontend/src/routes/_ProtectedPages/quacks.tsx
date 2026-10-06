import { useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { Seo } from "@/components/Seo"

import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"
import { QuackSearch } from "@/features/quack/components/QuackSearch"

const quacksSearchParamsSchema = z.object({
  q: z.string().optional().catch(undefined),
})

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  component: QuacksPage,
  validateSearch: quacksSearchParamsSchema,
})

function QuacksPage() {
  const { q = "" } = Route.useSearch()
  const search = q.trim()
  const navigate = useNavigate({ from: Route.fullPath })
  const quacksQuery = useQuery(quacksQueryOptions(search))

  const handleSearchChange = useCallback(
    (next: string) => {
      void navigate({ search: { q: next || undefined }, replace: true })
    },
    [navigate],
  )

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm className="mb-6" />

        <QuackSearch
          className="mb-4"
          value={search}
          onSearchChange={handleSearchChange}
        />

        <QuackList
          quacks={quacksQuery.data ?? []}
          isLoading={quacksQuery.isLoading}
          error={quacksQuery.error ?? undefined}
          // Only the error state offers a retry — posting invalidates the list,
          // and refocusing the tab refetches it.
          onReload={() => void quacksQuery.refetch()}
          search={search}
        />
      </section>
    </>
  )
}
