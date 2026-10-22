import { api } from '@/lib/api-client'
import {
  DocumentSchema,
  type ListDocumentsParams,
  ListDocumentsRequestSchema,
  PaginatedDocumentsSchema,
  type UploadDocumentRequest,
  UploadDocumentRequestSchema,
} from '@/features/documents/schemas'

export async function getDocuments(params: ListDocumentsParams = {}) {
  // axios sends Date params as ISO strings
  const res = await api.get('/documents', { params: ListDocumentsRequestSchema.parse(params) })
  return PaginatedDocumentsSchema.parse(res.data)
}

export async function uploadDocument(request: UploadDocumentRequest) {
  const res = await api.postForm('/documents/upload', UploadDocumentRequestSchema.parse(request))
  // backend sends 201 for a new file, 200 when the same file was already uploaded
  return { document: DocumentSchema.parse(res.data), isNew: res.status === 201 }
}

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${id}`)
}
