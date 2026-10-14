import { paginationMetaSchema } from 'shared'
import { z } from 'zod'

export const PaginationMetaSchema = z.object({
  page: z.number().catch(0),
  pageSize: z.number().catch(0),
  total: z.number().catch(0),
  totalPages: z.number().catch(0),
}) satisfies z.ZodType<z.input<typeof paginationMetaSchema>>
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>

/** Envelope for paginated list responses: `{ meta, data }`. `data` falls back to `[]`. */
export function paginatedSchema<TItem extends z.ZodType>(itemSchema: TItem) {
  return z.object({
    meta: PaginationMetaSchema,
    data: z.array(itemSchema).catch([]),
  })
}
