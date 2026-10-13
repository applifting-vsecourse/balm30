import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { useClosePoll } from "@/features/quack/hooks/useClosePoll"

type ClosePollButtonProps = { pollId: string }

export function ClosePollButton({ pollId }: ClosePollButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const close = useClosePoll(pollId)

  const handleOpenChange = (isNowOpen: boolean) => {
    if (!isNowOpen) close.reset()
    setIsOpen(isNowOpen)
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
        >
          Close poll
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close this poll?</AlertDialogTitle>
          <AlertDialogDescription>
            The current results become final. Nobody can vote or change their vote, and the poll
            can&apos;t be reopened.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {close.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{close.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={close.isPending}>Keep it open</AlertDialogCancel>
          <AlertDialogAction
            disabled={close.isPending}
            onClick={(event) => {
              event.preventDefault()
              close.mutate(undefined, { onSuccess: () => setIsOpen(false) })
            }}
          >
            {close.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Close poll
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
