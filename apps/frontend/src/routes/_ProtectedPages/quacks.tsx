import { useCallback, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { z } from "zod"

import { Seo } from "@/components/Seo"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileQueryOptions"
import { QUACK_SCOPES, type QuackScope } from "@/features/quack/api/quackSchemas"
import { quacksQueryOptions } from "@/features/quack/api/quacksQueryOptions"
import { QuackForm, type QuackFormHandle } from "@/features/quack/components/QuackForm"
import { QuackList } from "@/features/quack/components/QuackList"
import { QuackSearch } from "@/features/quack/components/QuackSearch"

const quacksSearchParamsSchema = z.object({
  q: z.string().optional().catch(undefined),
  scope: z.enum(QUACK_SCOPES).optional().catch(undefined),
})

const isQuackScope = (value: string): value is QuackScope =>
  (QUACK_SCOPES as readonly string[]).includes(value)

export const Route = createFileRoute("/_ProtectedPages/quacks")({
  component: QuacksPage,
  validateSearch: quacksSearchParamsSchema,
  loader: ({ context }) => context.queryClient.prefetchQuery(profileQueryOptions()),
})

function QuacksPage() {
  const { q = "", scope = "all" } = Route.useSearch()
  const search = q.trim()
  const navigate = useNavigate({ from: Route.fullPath })
  const quacksQuery = useQuery(quacksQueryOptions(search, scope))
  const profileQuery = useQuery(profileQueryOptions())
  const { user } = useSession()
  const formRef = useRef<QuackFormHandle>(null)

  const handleSearchChange = useCallback(
    (next: string) => {
      void navigate({
        search: (previous) => ({ ...previous, q: next || undefined }),
        replace: true,
      })
    },
    [navigate],
  )

  const handleScopeChange = (next: string) => {
    if (!isQuackScope(next)) return
    void navigate({
      search: (previous) => ({ ...previous, scope: next === "all" ? undefined : next }),
    })
  }

  return (
    <>
      <Seo title="Quacks" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quacks</h1>

        <QuackForm
          ref={formRef}
          className="mb-6"
          defaultMood={profileQuery.data?.defaultMood}
        />

        <Tabs
          value={scope}
          onValueChange={handleScopeChange}
          className="gap-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mine">Mine</TabsTrigger>
          </TabsList>

          <TabsContent value={scope}>
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
              scope={scope}
              onWriteFirst={() => formRef.current?.focusText()}
              viewerId={user?.id}
            />
          </TabsContent>
        </Tabs>
      </section>
    </>
  )
}
