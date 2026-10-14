import { type PaginationMeta, type PaginationQuery } from 'shared'

/** Turn `page`/`pageSize` into prisma `skip`/`take`. */
export function toPrismaPagination({ page, pageSize }: PaginationQuery) {
    return { skip: (page - 1) * pageSize, take: pageSize }
}

export function buildPaginationMeta(
    { page, pageSize }: PaginationQuery,
    total: number,
): PaginationMeta {
    return { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }
}
