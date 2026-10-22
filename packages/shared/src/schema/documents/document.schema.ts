import z from 'zod'
import { isoDateSchema } from '../common/date.schema.js'
import { listQuerySchema, paginatedSchema } from '../common/pagination.schema.js'
import { DOCUMENT_MAX_SIZE, DOCUMENT_MIME_TYPES } from '../../constants/document.constants.js'

export const documentSchema = z.object({
    id: z.uuid(),
    filename: z.string(),
    conversationId: z.uuid().nullable(),
    department: z.object({ id: z.uuid(), name: z.string() }).nullable(),
    createdAt: isoDateSchema,
    updatedAt: isoDateSchema,
})
export type Document = z.infer<typeof documentSchema>

export const uploadDocumentBodySchema = z.object({
    // multipart can't carry null, so '' (what axios sends for null) means null
    departmentId: z.preprocess((v) => (v === '' ? null : v), z.uuid().nullable()),
})
export type UploadDocumentBody = z.infer<typeof uploadDocumentBodySchema>

export const uploadDocumentRequestSchema = z.object({
    file: z
        .file('File is required')
        .max(DOCUMENT_MAX_SIZE, 'File must be 25MB or less')
        .mime([...DOCUMENT_MIME_TYPES], 'Allowed file formats: PDF, DOCX, TEXT'),
})
export type UploadDocumentRequest = z.infer<typeof uploadDocumentRequestSchema>

export const DOCUMENT_SORT_FIELDS = ['filename', 'createdAt', 'updatedAt'] as const satisfies (keyof Document)[]

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
