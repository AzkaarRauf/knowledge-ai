import { experimental_streamedQuery as streamedQuery, queryOptions, skipToken } from '@tanstack/react-query'
import { MAX_PAGE_SIZE } from 'shared'
import { getConversation, getConversations, getMessages, streamChat } from '@/features/conversations/api/conversationsApi'
import {
  type ListConversationsParams,
  type ListConversationsQuery,
  ListConversationsRequestSchema,
} from '@/features/conversations/schemas'

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (query: ListConversationsQuery) => [...conversationKeys.lists(), query] as const,
  detail: (id: string) => [...conversationKeys.all, 'detail', id] as const,
  messages: (id: string) => [...conversationKeys.detail(id), 'messages'] as const,
}

export const conversationsQueryOptions = (params: ListConversationsParams = {}) => {
  // parse so the key holds defaults, e.g. {} and { page: 1 } share one cache entry
  const query = ListConversationsRequestSchema.parse(params)
  return queryOptions({
    queryKey: conversationKeys.list(query),
    queryFn: () => getConversations(params),
  })
}

export const conversationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: conversationKeys.detail(id),
    queryFn: () => getConversation(id),
  })

export const messagesQueryOptions = (id: string) =>
  queryOptions({
    queryKey: conversationKeys.messages(id),
    // newest page first so long chats show their latest messages, then flip to oldest first for display
    queryFn: async () => {
      const res = await getMessages(id, { pageSize: MAX_PAGE_SIZE, sortOrder: 'desc' })
      return [...res.data].reverse()
    },
  })

/** A prompt waiting for its streamed reply. `sentAt` keeps two sends of the same text apart. */
export type PendingReply = { prompt: string; sentAt: number }

// Not under conversationKeys.all on purpose: the queryFn POSTs the prompt, so an
// invalidation of `all` (rename, create, a finished reply) must never refetch it.
export const chatReplyKeys = {
  all: ['chat-reply'] as const,
  reply: (conversationId: string, pending: PendingReply | null) => [...chatReplyKeys.all, conversationId, pending] as const,
}

/** Streams the reply to `pending.prompt`; data is the reply text so far. Idle while `pending` is null. */
export const chatReplyQueryOptions = (conversationId: string, pending: PendingReply | null) =>
  queryOptions({
    queryKey: chatReplyKeys.reply(conversationId, pending),
    queryFn: pending
      ? streamedQuery({
          // ignores the abort signal on purpose: leaving the page mid-reply lets the stream
          // finish, so the backend saves it and the messages refetch below still runs
          streamFn: async function* ({ client }) {
            yield* streamChat({ id: conversationId, request: { prompt: pending.prompt } })
            // backend saved both messages; wait for them to land so the streamed copy hides without a flicker
            await client.invalidateQueries({ queryKey: conversationKeys.all })
          },
          reducer: (text, chunk) => text + chunk,
          initialValue: '',
        })
      : skipToken,
    // each fetch POSTs the prompt again, so the query never runs on its own: not on mount, key
    // change, focus, reconnect or invalidation. Callers start it with fetchQuery/refetch().
    enabled: false,
    retry: false,
    staleTime: Infinity,
  })
