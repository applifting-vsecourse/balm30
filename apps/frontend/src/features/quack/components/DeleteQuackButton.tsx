import { useState } from "react"
import { Loader2, Trash2 } from "lucide-react"

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

import { useDeleteQuack } from "@/features/quack/hooks/useDeleteQuack"

type DeleteQuackButtonProps = {
  quackId: string
  authorUsername: string
  isOwnQuack: boolean
}

export function DeleteQuackButton({ quackId, authorUsername, isOwnQuack }: DeleteQuackButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const remove = useDeleteQuack(quackId)

  const handleOpenChange = (isNowOpen: boolean) => {
    if (!isNowOpen) remove.reset()
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
          <Trash2 className="size-4" />
          Delete quack
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isOwnQuack ? "Delete this quack?" : `Delete @${authorUsername}'s quack?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isOwnQuack ? null : "You're deleting it as a moderator. "}
            It disappears from the feed for everyone, together with its poll and votes. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {remove.isError ? (
          <Alert variant="destructive">
            <AlertDescription>{remove.error.message}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={remove.isPending}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={remove.isPending}
            onClick={(event) => {
              event.preventDefault()
              remove.mutate(undefined, { onSuccess: () => setIsOpen(false) })
            }}
          >
            {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
