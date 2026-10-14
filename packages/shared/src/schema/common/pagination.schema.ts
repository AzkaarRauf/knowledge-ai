import z from 'zod'

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

/** `?page=&pageSize=`. Query values are strings, so numbers are coerced. */
export const paginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})
export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export const sortOrderSchema = z.enum(['asc', 'desc'])
export type SortOrder = z.infer<typeof sortOrderSchema>

/**
 * Pagination + `?search=` + `?sortBy=&sortOrder=` for a list endpoint.
 * `.extend()` the result to add resource-specific filters.
 */
export function listQuerySchema<const TSortField extends string>({
    defaultSortBy,
    sortFields,
}: {
    sortFields: readonly [TSortField, ...TSortField[]]
    defaultSortBy: NoInfer<TSortField>
}) {
    return paginationQuerySchema.extend({
        search: z.string().trim().max(200).optional(),
        sortBy: z.enum(sortFields).default(defaultSortBy),
        sortOrder: sortOrderSchema.default('desc'),
    })
}

export const paginationMetaSchema = z.object({
    page: z.int(),
    pageSize: z.int(),
    total: z.int(),
    totalPages: z.int(),
})
export type PaginationMeta = z.infer<typeof paginationMetaSchema>

/** Response envelope for paginated lists: `{ meta, data }`. */
export function paginatedSchema<TItem extends z.ZodType>(itemSchema: TItem) {
    return z.object({
        meta: paginationMetaSchema,
        data: z.array(itemSchema),
    })
}
export type Paginated<T> = { meta: PaginationMeta; data: T[] }
