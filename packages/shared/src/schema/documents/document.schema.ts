import z from 'zod'
import { isoDateSchema } from '../common/date.schema.js'
import { listQuerySchema, paginatedSchema } from '../common/pagination.schema.js'

export const DOCUMENT_MAX_SIZE = 25 * 1024 * 1024 // 25mb
export const DOCUMENT_MIME_TYPES = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const documentSchema = z.object({
    id: z.uuid(),
    filename: z.string(),
    conversationId: z.uuid().nullable(),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
})
export type Document = z.infer<typeof documentSchema>

export const uploadDocumentRequestSchema = z.object({
    file: z
        .file('File is required')
        .max(DOCUMENT_MAX_SIZE, 'File must be 25MB or less')
        .mime([...DOCUMENT_MIME_TYPES], 'Allowed file formats: PDF, DOCX, TEXT'),
})
export type UploadDocumentRequest = z.infer<typeof uploadDocumentRequestSchema>

export const DOCUMENT_SORT_FIELDS = [
    'filename',
    'createdAt',
    'updatedAt',
] as const satisfies (keyof Document)[]

export const listDocumentsQuerySchema = listQuerySchema({
    sortFields: DOCUMENT_SORT_FIELDS,
    defaultSortBy: 'createdAt',
}).extend({
    conversationId: z.uuid().optional(),
    createdFrom: isoDateSchema.optional(),
    createdTo: isoDateSchema.optional(),
})
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>

export const paginatedDocumentsSchema = paginatedSchema(documentSchema)
export type PaginatedDocuments = z.infer<typeof paginatedDocumentsSchema>
