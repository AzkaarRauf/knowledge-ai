import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDocument } from '@/features/documents/api/documentsApi'
import { documentKeys } from '@/features/documents/api/queries'

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: documentKeys.all }),
  })
}
