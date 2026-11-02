import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteMessageFeedback } from '@/features/conversations/api/conversationsApi'
import { conversationKeys } from '@/features/conversations/api/queries'

export function useDeleteMessageFeedbackMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ conversationId, messageId }: { conversationId: string; messageId: string }) =>
      deleteMessageFeedback(conversationId, messageId),
    onSuccess: (_, { conversationId }) => queryClient.invalidateQueries({ queryKey: conversationKeys.messages(conversationId) }),
  })
}
