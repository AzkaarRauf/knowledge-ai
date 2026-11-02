import { useMutation, useQueryClient } from '@tanstack/react-query'
import { upsertMessageFeedback } from '@/features/conversations/api/conversationsApi'
import { conversationKeys } from '@/features/conversations/api/queries'
import { type UpsertFeedbackRequest } from '@/features/conversations/schemas'

export function useUpsertMessageFeedbackMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
      ...request
    }: { conversationId: string; messageId: string } & UpsertFeedbackRequest) =>
      upsertMessageFeedback(conversationId, messageId, request),
    onSuccess: (_, { conversationId }) => queryClient.invalidateQueries({ queryKey: conversationKeys.messages(conversationId) }),
  })
}
