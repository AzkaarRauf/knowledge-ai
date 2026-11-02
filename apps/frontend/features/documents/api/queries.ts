import { queryOptions } from '@tanstack/react-query'
import { getDocumentDownloadUrl, getDocuments } from '@/features/documents/api/documentsApi'
import { type ListDocumentsParams, type ListDocumentsQuery, ListDocumentsRequestSchema } from '@/features/documents/schemas'

export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (query: ListDocumentsQuery) => [...documentKeys.lists(), query] as const,
  detail: (id: string) => [...documentKeys.all, 'detail', id] as const,
  downloadUrl: (id: string) => [...documentKeys.detail(id), 'download-url'] as const,
}

export const documentsQueryOptions = (params: ListDocumentsParams = {}) => {
  // parse so the key holds defaults, e.g. {} and { page: 1 } share one cache entry
  const query = ListDocumentsRequestSchema.parse(params)
  return queryOptions({
    queryKey: documentKeys.list(query),
    queryFn: () => getDocuments(params),
  })
}

export const documentDownloadUrlQueryOptions = (id: string) =>
  queryOptions({
    queryKey: documentKeys.downloadUrl(id),
    queryFn: () => getDocumentDownloadUrl(id),
    // presigned urls expire, so always fetch a fresh one and never keep it
    staleTime: 0,
    gcTime: 0,
  })
