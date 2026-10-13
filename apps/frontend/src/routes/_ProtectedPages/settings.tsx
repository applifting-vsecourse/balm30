import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { Seo } from "@/components/Seo"

import { profileQueryOptions } from "@/features/profile/api/profileQueryOptions"
import { ProfileForm } from "@/features/profile/components/ProfileForm"
import { quackKeys } from "@/features/quack/api/quackKeys"

export const Route = createFileRoute("/_ProtectedPages/settings")({
  component: SettingsPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(profileQueryOptions()),
})

function SettingsPage() {
  const queryClient = useQueryClient()
  const { data: profile } = useSuspenseQuery(profileQueryOptions())

  const handleSaved = () => {
    void queryClient.resetQueries({ queryKey: quackKeys.all() })
  }

  return (
    <>
      <Seo title="Settings" />
      <section className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Settings</h1>
        <ProfileForm
          profile={profile}
          onSaved={handleSaved}
        />
      </section>
    </>
  )
}
