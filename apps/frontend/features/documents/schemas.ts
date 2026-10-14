import { documentSchema, listDocumentsQuerySchema, uploadDocumentRequestSchema } from 'shared'
import { z } from 'zod'
import { paginatedSchema } from '@/lib/schemas'

export const DocumentSchema = z.object({
  id: z.string().catch(''),
  filename: z.string().catch(''),
  conversationId: z.string().nullable().catch(null),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
}) satisfies z.ZodType<z.input<typeof documentSchema>>
export type Document = z.infer<typeof DocumentSchema>

export const PaginatedDocumentsSchema = paginatedSchema(DocumentSchema)
export type PaginatedDocuments = z.infer<typeof PaginatedDocumentsSchema>

export const ListDocumentsRequestSchema = listDocumentsQuerySchema
/** What callers pass: every field optional, defaults filled in on parse. */
export type ListDocumentsParams = z.input<typeof ListDocumentsRequestSchema>
export type ListDocumentsQuery = z.output<typeof ListDocumentsRequestSchema>

export const UploadDocumentRequestSchema = uploadDocumentRequestSchema
