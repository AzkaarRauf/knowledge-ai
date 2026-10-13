import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteDocument } from '@/features/documents/api/documentsApi'
import { documentKeys } from '@/features/documents/api/queries'

export function useDeleteDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id }: { id: string }) => deleteDocument(id),
    onSuccess: (_, { id }) => {
      queryClient.removeQueries({ queryKey: documentKeys.detail(id) })
      return queryClient.invalidateQueries({ queryKey: documentKeys.all })
    },
  })
}
