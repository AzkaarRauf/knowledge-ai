'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, MessageSquareOff, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { chatReplyQueryOptions, conversationQueryOptions, messagesQueryOptions } from '@/features/conversations/api/queries'
import { ChatComposer } from '@/features/conversations/components/ChatComposer'
import { ChatMessage } from '@/features/conversations/components/ChatMessage'
import { clearPendingReply, getPendingReply } from '@/features/conversations/pending-prompt'
import { publicDepartmentsQueryOptions } from '@/features/departments/api/queries'

export function ConversationView({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient()
  const { data: messages = [], isPending, isError: isLoadError } = useQuery(messagesQueryOptions(conversationId))
  // starts with the first prompt typed on /chat, if this chat was just created there (NewChat already started its reply)
  const [pending, setPending] = useState(() => getPendingReply(conversationId))
  useEffect(() => {
    clearPendingReply(conversationId)
  }, [conversationId])

  // never runs on its own (enabled: false). Send starts it below; Retry calls refetch(). Failures toast globally.
  const reply = useQuery(chatReplyQueryOptions(conversationId, pending))
  const isReplying = reply.fetchStatus === 'fetching'
  // once done, the saved messages have landed (the stream awaits their refetch), so hide the streamed copy
  const showPending = pending !== null && (isReplying || reply.isError)
  const bottomRef = useRef<HTMLDivElement>(null)

  function handleSend(prompt: string) {
    const next = { prompt, sentAt: Date.now() }
    setPending(next)
    // refetch() can't start it: it targets the current key, and `next` gets its own key only after re-render.
    // prefetchQuery ignores `enabled` and runs once, from this click; the observer picks it up by key.
    void queryClient.prefetchQuery(chatReplyQueryOptions(conversationId, next))
    return true
  }

  // keep the newest content in view while the reply streams in
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, showPending, reply.data])

  if (isLoadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareOff />
            </EmptyMedia>
            <EmptyTitle>Chat not found</EmptyTitle>
            <EmptyDescription>It may have been deleted.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/chat" />}>
              New chat
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const isEmpty = !isPending && messages.length === 0 && !showPending

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto">
        {isPending ? (
          <MessageListSkeleton />
        ) : isEmpty ? (
          <div className="flex h-full items-center justify-center px-4">
            <h1 className="text-2xl font-semibold">What can I help with?</h1>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {showPending && (
              <>
                <ChatMessage message={{ role: 'user', content: pending.prompt }} />
                {reply.isError ? (
                  // backend saves nothing on failure, so sending the same prompt again is safe
                  <div className="flex items-center gap-3 text-sm text-destructive">
                    Something went wrong.
                    <Button variant="outline" size="sm" onClick={() => void reply.refetch()}>
                      <RotateCcw data-icon="inline-start" />
                      Retry
                    </Button>
                  </div>
                ) : reply.data ? (
                  <ChatMessage message={{ role: 'assistant', content: reply.data }} streaming />
                ) : (
                  <p className="animate-pulse text-muted-foreground">Thinking…</p>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
      <div className="relative mx-auto w-full max-w-3xl px-4 pb-4">
        <ChatComposer onSend={handleSend} disabled={isReplying || isPending} autoFocus />
        <ConversationDepartment conversationId={conversationId} />
        <p className="mt-2 text-center text-xs text-muted-foreground">Answers come from your documents only.</p>
      </div>
    </div>
  )
}

/** Pill naming the department this chat searches in. Absolute, so it sits on the footnote line without taking space. */
function ConversationDepartment({ conversationId }: { conversationId: string }) {
  const { data: conversation, isPending: conversationPending } = useQuery(conversationQueryOptions(conversationId))
  const { data: departments = [], isPending: departmentsPending } = useQuery(publicDepartmentsQueryOptions())

  if (conversationPending || departmentsPending) {
    return <Skeleton role="status" aria-label="Loading department" className="absolute bottom-4 left-4 h-5 w-32 rounded-full" />
  }

  const department = departments.find((d) => d.id === conversation?.departmentId)
  return (
    <div className="absolute bottom-4 left-4 inline-flex h-5 items-center gap-1.5 rounded-full border bg-muted px-2.5 text-xs text-muted-foreground">
      <Building2 className="size-3.5" />
      {department ? department.name : 'No department'}
    </div>
  )
}

export function MessageListSkeleton() {
  return (
    <div role="status" aria-label="Loading messages" className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex flex-col gap-8">
          <Skeleton className="ml-auto h-11 w-2/5 rounded-3xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-11/12" />
            <Skeleton className="h-5 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Route fallback: message skeletons + the composer frame. */
export function ConversationViewSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-hidden">
        <MessageListSkeleton />
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <Skeleton className="h-14 rounded-3xl" />
        <div className="h-6" />
      </div>
    </div>
  )
}
