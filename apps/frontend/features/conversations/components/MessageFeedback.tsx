'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { isError, safe } from 'shared'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useDeleteMessageFeedbackMutation } from '@/features/conversations/hooks/useDeleteMessageFeedbackMutation'
import { useUpsertMessageFeedbackMutation } from '@/features/conversations/hooks/useUpsertMessageFeedbackMutation'
import { type FeedbackRating, type Message } from '@/features/conversations/schemas'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

/** Thumbs up/down under an assistant reply. Clicking the active thumb clears it. */
export function MessageFeedback({
  conversationId,
  message,
}: {
  conversationId: string
  message: Pick<Message, 'id' | 'feedback'>
}) {
  const upsertMutation = useUpsertMessageFeedbackMutation()
  const deleteMutation = useDeleteMessageFeedbackMutation()
  const isSaving = upsertMutation.isPending || deleteMutation.isPending
  // show the clicked rating right away, before the messages refetch lands
  const rating = upsertMutation.isPending ? upsertMutation.variables.rating : deleteMutation.isPending ? null : message.feedback

  async function handleRate(next: FeedbackRating) {
    const vars = { conversationId, messageId: message.id }
    const res =
      next === rating
        ? await safe(deleteMutation.mutateAsync(vars))
        : await safe(upsertMutation.mutateAsync({ ...vars, rating: next }))
    if (isError(res)) toast.error(getErrorMessage(res))
  }

  return (
    <div className="-mt-6 flex gap-1 text-muted-foreground">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Good answer"
        aria-pressed={rating === 'UP'}
        disabled={isSaving}
        onClick={() => void handleRate('UP')}
      >
        <ThumbsUp className={cn(rating === 'UP' && 'fill-current text-foreground')} />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Bad answer"
        aria-pressed={rating === 'DOWN'}
        disabled={isSaving}
        onClick={() => void handleRate('DOWN')}
      >
        <ThumbsDown className={cn(rating === 'DOWN' && 'fill-current text-foreground')} />
      </Button>
    </div>
  )
}
