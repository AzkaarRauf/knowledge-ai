'use client'

import { useQuery } from '@tanstack/react-query'
import { differenceInCalendarDays } from 'date-fns'
import { Pencil, SquarePen, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Suspense, useState } from 'react'
import { toast } from 'sonner'
import { isError, MAX_PAGE_SIZE, safe } from 'shared'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { conversationsQueryOptions } from '@/features/conversations/api/queries'
import { RenameConversationDialog } from '@/features/conversations/components/RenameConversationDialog'
import { useDeleteConversationMutation } from '@/features/conversations/hooks/useDeleteConversationMutation'
import { type Conversation } from '@/features/conversations/schemas'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

export function ChatSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="p-2">
        <Button variant="ghost" className="w-full justify-start" nativeButton={false} render={<Link href="/chat" />}>
          <SquarePen data-icon="inline-start" />
          New chat
        </Button>
      </div>
      {/* the list reads the route params, which needs a Suspense boundary */}
      <Suspense
        fallback={
          <div className="px-2">
            <ChatSidebarSkeleton />
          </div>
        }
      >
        <ConversationList />
      </Suspense>
    </aside>
  )
}

function ConversationList() {
  const router = useRouter()
  const { conversationId } = useParams<{ conversationId?: string }>()
  const { data, isPending } = useQuery(conversationsQueryOptions({ pageSize: MAX_PAGE_SIZE }))
  // only group once data is here: grouping reads the clock, which the prerender must not do
  const groups = data ? groupByDay(data.data) : []

  const [conversationToRename, setConversationToRename] = useState<Conversation | null>(null)
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null)
  const deleteMutation = useDeleteConversationMutation()

  async function handleDeleteConfirm() {
    if (!conversationToDelete) return
    const { id, title } = conversationToDelete
    setConversationToDelete(null)
    const res = await safe(deleteMutation.mutateAsync({ id }))
    if (isError(res)) return toast.error(getErrorMessage(res))
    toast.success(`"${title}" deleted`)
    if (id === conversationId) router.push('/chat')
  }

  return (
    <>
      <nav aria-label="Chats" className="flex-1 overflow-y-auto px-2 pb-4">
        {isPending ? (
          <ChatSidebarSkeleton />
        ) : groups.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">No chats yet</p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mt-4 first:mt-2">
              <h2 className="px-2 pb-1 text-xs font-medium text-muted-foreground">{group.label}</h2>
              <ul className="flex flex-col gap-0.5">
                {group.items.map((conversation) => (
                  <li key={conversation.id}>
                    <div
                      className={cn(
                        'group relative flex items-center rounded-lg text-sm hover:bg-sidebar-accent',
                        conversation.id === conversationId && 'bg-sidebar-accent text-sidebar-accent-foreground',
                      )}
                    >
                      <Link
                        href={`/chat/${conversation.id}`}
                        aria-current={conversation.id === conversationId ? 'page' : undefined}
                        className="flex-1 truncate px-2 py-1.5"
                        title={conversation.title}
                      >
                        {conversation.title}
                      </Link>
                      {/* actions show on hover / keyboard focus, like ChatGPT */}
                      <div className="flex shrink-0 pr-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Rename ${conversation.title}`}
                          onClick={() => setConversationToRename(conversation)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Delete ${conversation.title}`}
                          disabled={deleteMutation.isPending}
                          onClick={() => setConversationToDelete(conversation)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </nav>

      <RenameConversationDialog
        conversation={conversationToRename}
        onOpenChange={(open) => {
          if (!open) setConversationToRename(null)
        }}
      />
      <ConfirmationDialog
        open={conversationToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConversationToDelete(null)
        }}
        onAccept={handleDeleteConfirm}
        title="Delete chat?"
        description={`This will permanently delete "${conversationToDelete?.title}".`}
        confirmText="Delete"
        destructive
      />
    </>
  )
}

/** Splits chats (already newest first) into Today / Yesterday / Previous 7 days / Older. */
function groupByDay(conversations: Conversation[]) {
  const now = new Date()
  const labelFor = (updatedAt: string) => {
    const days = differenceInCalendarDays(now, new Date(updatedAt))
    if (days <= 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days <= 7) return 'Previous 7 days'
    return 'Older'
  }
  const groups: { label: string; items: Conversation[] }[] = []
  for (const conversation of conversations) {
    const label = labelFor(conversation.updatedAt)
    const last = groups.at(-1)
    if (last?.label === label) last.items.push(conversation)
    else groups.push({ label, items: [conversation] })
  }
  return groups
}

function ChatSidebarSkeleton() {
  return (
    <div role="status" aria-label="Loading chats" className="mt-2 flex flex-col gap-0.5">
      <Skeleton className="mx-2 mb-1 h-4 w-16" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-8" />
      ))}
    </div>
  )
}
