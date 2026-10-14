import { queryOptions } from '@tanstack/react-query'
import { getDocuments } from '@/features/documents/api/documentsApi'
import { type ListDocumentsParams, type ListDocumentsQuery, ListDocumentsRequestSchema } from '@/features/documents/schemas'

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (query: ListDocumentsQuery) => [...documentKeys.lists(), query] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
}

export const documentsQueryOptions = (params: ListDocumentsParams = {}) => {
  // parse so the key holds defaults, e.g. {} and { page: 1 } share one cache entry
  const query = ListDocumentsRequestSchema.parse(params)
  return queryOptions({
    queryKey: documentKeys.list(query),
    queryFn: () => getDocuments(params),
  })
}
