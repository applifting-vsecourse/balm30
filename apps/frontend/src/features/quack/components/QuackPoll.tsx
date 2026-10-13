import { Check, RefreshCw } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import type { Poll } from "@/features/quack/api/quackSchemas"
import { useVote } from "@/features/quack/hooks/useVote"

const percentOf = (votes: number, total: number) =>
  total === 0 ? 0 : Math.round((votes / total) * 100)

const formatVotes = (count: number) => `${count} ${count === 1 ? "vote" : "votes"}`

type QuackPollProps = { poll: Poll }

export function QuackPoll({ poll }: QuackPollProps) {
  const vote = useVote(poll.id)
  const isClosed = poll.closedAt !== null

  return (
    <div className="mt-2 flex flex-col gap-2">
      <p className="text-sm font-medium">{poll.question}</p>
      <ul
        aria-label="Answers"
        className="flex flex-col gap-2"
      >
        {poll.options.map((option) => {
          const isMine = option.id === poll.myOptionId
          const percent = percentOf(option.votes, poll.totalVotes)
          return (
            <li key={option.id}>
              <Button
                type="button"
                variant="outline"
                aria-pressed={isMine}
                disabled={isClosed}
                onClick={() => vote.mutate(isMine ? null : option.id)}
                className={cn(
                  "relative h-auto w-full justify-between gap-3 overflow-hidden py-2 text-left font-normal whitespace-normal",
                  isMine && "border-foreground font-medium",
                )}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 bg-secondary transition-all"
                  style={{ width: `${percent}%` }}
                />
                <span className="relative flex min-w-0 items-center gap-2 break-words">
                  {isMine ? <Check className="size-4" /> : null}
                  {option.text}
                </span>
                <span className="relative shrink-0 text-muted-foreground tabular-nums">
                  {option.votes} · {percent}%
                </span>
              </Button>
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">{formatVotes(poll.totalVotes)}</p>

      {vote.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Your vote didn&apos;t go through</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{vote.error.message}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => vote.mutate(vote.variables)}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
