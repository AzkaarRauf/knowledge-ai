'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import { chatReplyQueryOptions } from '@/features/conversations/api/queries'
import { ChatComposer } from '@/features/conversations/components/ChatComposer'
import { useCreateConversationMutation } from '@/features/conversations/hooks/useCreateConversationMutation'
import { setPendingReply } from '@/features/conversations/pending-prompt'
import { getErrorMessage } from '@/lib/errors'

const TITLE_MAX_LENGTH = 60

/** Empty chat. The first prompt creates the conversation, then the reply streams on its page. */
export function NewChat() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createMutation = useCreateConversationMutation()

  async function handleSend(prompt: string) {
    const title = prompt.length > TITLE_MAX_LENGTH ? `${prompt.slice(0, TITLE_MAX_LENGTH).trimEnd()}…` : prompt
    const res = await safe(createMutation.mutateAsync({ title }))
    if (isError(res)) {
      toast.error(getErrorMessage(res))
      return false
    }
    const pending = { prompt, sentAt: Date.now() }
    // start the reply here; the stream lives in the cache, so it keeps going across the navigation
    void queryClient.prefetchQuery(chatReplyQueryOptions(res.id, pending))
    setPendingReply(res.id, pending)
    router.push(`/chat/${res.id}`)
    return true
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-[15vh]">
      <h1 className="text-2xl font-semibold sm:text-3xl">What can I help with?</h1>
      <ChatComposer onSend={handleSend} disabled={createMutation.isPending} autoFocus className="w-full max-w-3xl" />
    </div>
  )
}
