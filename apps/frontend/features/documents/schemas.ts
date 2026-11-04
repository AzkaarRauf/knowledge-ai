import {
  documentDownloadUrlSchema,
  documentSchema,
  documentStatusSchema,
  listDocumentsQuerySchema,
  uploadDocumentBodySchema,
  uploadDocumentRequestSchema,
} from 'shared'
import { z } from 'zod'
import { paginatedSchema } from '@/lib/schemas'

export const DocumentStatusSchema = documentStatusSchema
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>

export const DocumentSchema = z.object({
  id: z.string().catch(''),
  filename: z.string().catch(''),
  status: DocumentStatusSchema.catch('DONE'),
  conversationId: z.string().nullable().catch(null),
  department: z
    .object({ id: z.string().catch(''), name: z.string().catch('') })
    .nullable()
    .catch(null),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
}) satisfies z.ZodType<z.input<typeof documentSchema>>
export type Document = z.infer<typeof DocumentSchema>

export const DocumentDownloadUrlSchema = z.object({
  url: z.string().catch(''),
}) satisfies z.ZodType<z.input<typeof documentDownloadUrlSchema>>
export type DocumentDownloadUrl = z.infer<typeof DocumentDownloadUrlSchema>

export const PaginatedDocumentsSchema = paginatedSchema(DocumentSchema)
export type PaginatedDocuments = z.infer<typeof PaginatedDocumentsSchema>

export const ListDocumentsRequestSchema = listDocumentsQuerySchema
/** What callers pass: every field optional, defaults filled in on parse. */
export type ListDocumentsParams = z.input<typeof ListDocumentsRequestSchema>
export type ListDocumentsQuery = z.output<typeof ListDocumentsRequestSchema>

export const UploadDocumentRequestSchema = uploadDocumentRequestSchema.extend(uploadDocumentBodySchema.shape)
export type UploadDocumentRequest = z.infer<typeof UploadDocumentRequestSchema>

/** Upload dialog: file is null until picked, department null means none. */
export const DocumentUploadFormSchema = z.object({
  file: z.file().nullable().pipe(UploadDocumentRequestSchema.shape.file),
  departmentId: z.uuid().nullable(),
})
export type DocumentUploadFormInput = z.input<typeof DocumentUploadFormSchema>
