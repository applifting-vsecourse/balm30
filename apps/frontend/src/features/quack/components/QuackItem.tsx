import { Link } from "@tanstack/react-router"
import { MessageCircle } from "lucide-react"

import { ROUTES } from "@/app/routes"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDate } from "@/lib/date"

import type { DeletedQuack, LiveQuack, Quack, ReplyingTo } from "@/features/quack/api/quackSchemas"
import { DeleteQuackButton } from "@/features/quack/components/DeleteQuackButton"
import { QuackMood } from "@/features/quack/components/QuackMood"
import { QuackPoll } from "@/features/quack/components/QuackPoll"
import { UsersName } from "@/features/quack/components/UsersName"
import { UsersUserName } from "@/features/quack/components/UsersUserName"

type ThreadLinkProps = {
  shouldShowRepliesLink?: boolean
  shouldShowReplyingTo?: boolean
}

type QuackItemProps = ThreadLinkProps & { quack: Quack; viewerId?: string }

export function QuackItem({ quack, ...props }: QuackItemProps) {
  return quack.isDeleted ? (
    <DeletedQuackItem
      quack={quack}
      {...props}
    />
  ) : (
    <LiveQuackItem
      quack={quack}
      {...props}
    />
  )
}

const ARTICLE_CLASS = "flex w-full gap-4 border-b border-border pt-2 pb-4 last:border-b-0"

function LiveQuackItem({
  quack,
  viewerId,
  shouldShowRepliesLink = true,
  shouldShowReplyingTo = true,
}: ThreadLinkProps & { quack: LiveQuack; viewerId?: string }) {
  const { name, username } = quack.user

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <article className={ARTICLE_CLASS}>
      <Avatar className="size-12">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span>
            <UsersName name={name} /> <UsersUserName username={username} />
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <time className="text-xs text-muted-foreground">{formatDate(quack.createdAt)}</time>
          {quack.mood ? (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <QuackMood mood={quack.mood} />
            </>
          ) : null}
          {quack.canDelete ? (
            <span className="ml-auto">
              <DeleteQuackButton
                quackId={quack.id}
                authorUsername={username}
                isOwnQuack={quack.userId === viewerId}
                replyCount={quack.replyCount}
              />
            </span>
          ) : null}
        </div>
        {shouldShowReplyingTo && quack.replyingTo ? (
          <ReplyingToLink replyingTo={quack.replyingTo} />
        ) : null}
        {quack.text ? (
          <p className="text-sm break-words whitespace-pre-line">{quack.text}</p>
        ) : null}
        {quack.poll ? <QuackPoll poll={quack.poll} /> : null}
        {shouldShowRepliesLink ? (
          <RepliesLink
            quackId={quack.id}
            replyCount={quack.replyCount}
          />
        ) : null}
      </div>
    </article>
  )
}

function DeletedQuackItem({
  quack,
  shouldShowRepliesLink = true,
  shouldShowReplyingTo = true,
}: ThreadLinkProps & { quack: DeletedQuack }) {
  return (
    <article className={ARTICLE_CLASS}>
      <Avatar
        className="size-12"
        aria-hidden="true"
      >
        <AvatarFallback />
      </Avatar>

      <div className="flex flex-1 flex-col gap-1">
        {shouldShowReplyingTo && quack.replyingTo ? (
          <ReplyingToLink replyingTo={quack.replyingTo} />
        ) : null}
        <p className="text-sm text-muted-foreground">This quack was deleted.</p>
        {shouldShowRepliesLink && quack.replyCount > 0 ? (
          <RepliesLink
            quackId={quack.id}
            replyCount={quack.replyCount}
          />
        ) : null}
      </div>
    </article>
  )
}

function ReplyingToLink({ replyingTo }: { replyingTo: ReplyingTo }) {
  return (
    <p className="text-xs text-muted-foreground">
      Replying to{" "}
      <Link
        to={ROUTES.quack}
        params={{ quackId: replyingTo.quackId }}
        className="underline-offset-4 hover:text-foreground hover:underline"
      >
        {replyingTo.username ? `@${replyingTo.username}` : "a deleted quack"}
      </Link>
    </p>
  )
}

const repliesLabel = (replyCount: number): string =>
  replyCount === 0 ? "Reply" : replyCount === 1 ? "1 reply" : `${replyCount} replies`

function RepliesLink({ quackId, replyCount }: { quackId: string; replyCount: number }) {
  return (
    <Link
      to={ROUTES.quack}
      params={{ quackId }}
      className="mt-1 inline-flex items-center gap-1 self-start text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <MessageCircle
        className="size-4"
        aria-hidden="true"
      />
      {repliesLabel(replyCount)}
    </Link>
  )
}
