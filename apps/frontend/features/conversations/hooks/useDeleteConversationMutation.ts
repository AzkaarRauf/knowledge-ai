import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteConversation } from '@/features/conversations/api/conversationsApi'
import { conversationKeys } from '@/features/conversations/api/queries'

export function useDeleteConversationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteConversation(id),
    onSuccess: (_, { id }) => {
      queryClient.removeQueries({ queryKey: conversationKeys.detail(id) })
      return queryClient.invalidateQueries({ queryKey: conversationKeys.all })
    },
  })
}
