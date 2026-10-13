import { api } from '@/lib/api-client'
import {
  DocumentListSchema,
  DocumentSchema,
  UploadDocumentRequestSchema,
} from '@/features/documents/schemas'
import { type UploadDocumentRequest } from 'shared'

export async function getDocuments() {
  const res = await api.get('/documents')
  return DocumentListSchema.parse(res.data)
}

export async function uploadDocument(request: UploadDocumentRequest) {
  const res = await api.postForm('/documents/upload', UploadDocumentRequestSchema.parse(request))
  // backend sends 201 for a new file, 200 when the same file was already uploaded
  return { document: DocumentSchema.parse(res.data), isNew: res.status === 201 }
}

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${id}`)
}
