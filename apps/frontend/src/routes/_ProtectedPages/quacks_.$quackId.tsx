import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { Seo } from "@/components/Seo"

import { useSession } from "@/features/auth/hooks/useSession"
import { profileQueryOptions } from "@/features/profile/api/profileQueryOptions"
import { quackThreadQueryOptions } from "@/features/quack/api/quackThreadQueryOptions"
import { QuackThreadView } from "@/features/quack/components/QuackThreadView"

export const Route = createFileRoute("/_ProtectedPages/quacks_/$quackId")({
  component: QuackThreadPage,
  loader: ({ context }) => context.queryClient.prefetchQuery(profileQueryOptions()),
})

function QuackThreadPage() {
  const { quackId } = Route.useParams()
  const threadQuery = useQuery(quackThreadQueryOptions(quackId))
  const profileQuery = useQuery(profileQueryOptions())
  const { user } = useSession()

  return (
    <>
      <Seo title="Quack" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <Link
          to={ROUTES.quacks}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <ArrowLeft
            className="size-4"
            aria-hidden="true"
          />
          All quacks
        </Link>
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Quack</h1>

        <QuackThreadView
          thread={threadQuery.data}
          isLoading={threadQuery.isLoading}
          error={threadQuery.error ?? undefined}
          onReload={() => void threadQuery.refetch()}
          viewerId={user?.id}
          defaultMood={profileQuery.data?.defaultMood}
        />
      </section>
    </>
  )
}
