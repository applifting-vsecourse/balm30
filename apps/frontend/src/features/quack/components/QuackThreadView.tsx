import { Link } from "@tanstack/react-router"
import { Loader2, RefreshCw } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { HTTPError } from "@/lib/api-client"
import type { Mood } from "@/lib/mood"

import type { QuackThread } from "@/features/quack/api/quackSchemas"
import { QuackForm } from "@/features/quack/components/QuackForm"
import { QuackItem } from "@/features/quack/components/QuackItem"
import { QuackList } from "@/features/quack/components/QuackList"

type QuackThreadViewProps = {
  thread?: QuackThread
  isLoading?: boolean
  error?: Error
  onReload?: () => void
  viewerId?: string
  defaultMood?: Mood | null
}

const isNotFound = (error: Error): boolean =>
  error instanceof HTTPError && error.response.status === 404

export function QuackThreadView({
  thread,
  isLoading,
  error,
  onReload,
  viewerId,
  defaultMood,
}: QuackThreadViewProps) {
  if (error && isNotFound(error)) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-muted-foreground">
          This quack doesn&apos;t exist, or it was deleted.
        </p>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link to={ROUTES.quacks}>Back to all quacks</Link>
        </Button>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load this quack</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{error.message}</span>
          {onReload ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onReload}
            >
              <RefreshCw className="size-4" />
              Reload
            </Button>
          ) : null}
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading || !thread) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <QuackItem
        quack={thread.quack}
        viewerId={viewerId}
        shouldShowRepliesLink={false}
      />

      {thread.quack.isDeleted ? null : (
        <QuackForm
          key={thread.quack.id}
          parentId={thread.quack.id}
          defaultMood={defaultMood}
        />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Replies</h2>
        <QuackList
          quacks={thread.replies}
          viewerId={viewerId}
          shouldShowReplyingTo={false}
          emptyText="No replies yet. Be the first to reply."
        />
      </div>
    </div>
  )
}
