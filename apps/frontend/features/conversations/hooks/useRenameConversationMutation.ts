import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateConversation } from '@/features/conversations/api/conversationsApi'
import { conversationKeys } from '@/features/conversations/api/queries'
import { type UpdateConversationRequest } from '@/features/conversations/schemas'

export function useRenameConversationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...request }: { id: string } & UpdateConversationRequest) => updateConversation(id, request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: conversationKeys.all }),
  })
}
