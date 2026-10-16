import { type PendingReply } from '@/features/conversations/api/queries'

// Holds the first prompt of a new chat while the app navigates from /chat to /chat/[id].
const pendingReplies = new Map<string, PendingReply>()

export function setPendingReply(conversationId: string, reply: PendingReply) {
  pendingReplies.set(conversationId, reply)
}

/** Safe to call more than once (Strict Mode runs state initializers twice). */
export function getPendingReply(conversationId: string) {
  return pendingReplies.get(conversationId) ?? null
}

export function clearPendingReply(conversationId: string) {
  pendingReplies.delete(conversationId)
}
