import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createConversation } from '@/features/conversations/api/conversationsApi'
import { conversationKeys } from '@/features/conversations/api/queries'
import { type CreateConversationRequest } from '@/features/conversations/schemas'

export function useCreateConversationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateConversationRequest) => createConversation(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
  })
}
