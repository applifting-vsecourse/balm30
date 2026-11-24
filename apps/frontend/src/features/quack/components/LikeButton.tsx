import { Heart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useLike } from "@/features/quack/hooks/useLike"

type LikeButtonProps = {
  quackId: string
  likeCount: number
  isLikedByMe: boolean
}

export function LikeButton({ quackId, likeCount, isLikedByMe }: LikeButtonProps) {
  const like = useLike(quackId)

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      aria-label="Like"
      aria-pressed={isLikedByMe}
      className="text-muted-foreground hover:text-foreground aria-pressed:text-foreground"
      onClick={() => like.mutate(!isLikedByMe)}
    >
      <Heart
        className={cn("size-4", isLikedByMe && "fill-current")}
        aria-hidden="true"
      />
      <span className="tabular-nums">{likeCount}</span>
    </Button>
  )
}
