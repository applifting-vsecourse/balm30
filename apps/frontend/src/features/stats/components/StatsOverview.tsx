import { Loader2, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import type { Stats } from "@/features/stats/api/statsSchemas"

type StatsOverviewProps = {
  stats?: Stats
  isLoading?: boolean
  error?: Error
  onReload?: () => void
}

const formatCount = (count: number) => count.toLocaleString("en")

export function StatsOverview({ stats, isLoading, error, onReload }: StatsOverviewProps) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn&apos;t load stats</AlertTitle>
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

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <Loader2
          className="size-5 animate-spin"
          aria-label="Loading stats"
        />
      </div>
    )
  }

  const rows = [
    { label: "Users", value: stats.users },
    { label: "Quacks", value: stats.quacks },
    { label: `Quacks in the last ${stats.recentDays} days`, value: stats.recentQuacks },
    { label: "Polls", value: stats.polls },
    { label: "Votes", value: stats.votes },
  ]

  return (
    <dl className="flex flex-col">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-4 border-b border-border py-3 last:border-b-0"
        >
          <dt className="text-sm text-muted-foreground">{row.label}</dt>
          <dd className="text-xl font-semibold tracking-tight tabular-nums">
            {formatCount(row.value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
