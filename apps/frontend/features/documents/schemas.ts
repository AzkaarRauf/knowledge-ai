import { documentSchema, uploadDocumentRequestSchema } from 'shared'
import { z } from 'zod'

export const DocumentSchema = z.object({
  id: z.string().catch(''),
  filename: z.string().catch(''),
  conversationId: z.string().nullable().catch(null),
  createdAt: z.string().catch(''),
  updatedAt: z.string().catch(''),
}) satisfies z.ZodType<z.input<typeof documentSchema>>
export type Document = z.infer<typeof DocumentSchema>

export const DocumentListSchema = z.array(DocumentSchema).catch([])

export const UploadDocumentRequestSchema = uploadDocumentRequestSchema
