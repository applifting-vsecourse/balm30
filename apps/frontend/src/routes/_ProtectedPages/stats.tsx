import { useQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"

import { authSessionQueryOptions } from "@/features/auth/api/authSessionQueryOptions"
import { isAdmin } from "@/features/auth/lib/roles"
import { statsQueryOptions } from "@/features/stats/api/statsQueryOptions"
import { StatsOverview } from "@/features/stats/components/StatsOverview"

export const Route = createFileRoute("/_ProtectedPages/stats")({
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(authSessionQueryOptions())
    if (session && !isAdmin(session.user)) {
      throw redirect({ to: ROUTES.quacks })
    }
  },
  component: StatsPage,
})

function StatsPage() {
  const statsQuery = useQuery(statsQueryOptions())

  return (
    <>
      <Seo title="Stats" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Stats</h1>
        <StatsOverview
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
          error={statsQuery.error ?? undefined}
          onReload={() => void statsQuery.refetch()}
        />
      </section>
    </>
  )
}
