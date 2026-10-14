'use client'

import { type MouseEvent } from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { type DocumentListParamUpdates } from '@/features/documents/hooks/useDocumentListParams'
import { type PaginationMeta } from '@/lib/schemas'

const PAGE_SIZE_OPTIONS = [10, 20, 50].map((size) => ({ value: String(size), label: String(size) }))

type Props = {
  meta: PaginationMeta
  hrefFor: (updates: DocumentListParamUpdates) => string
  setParams: (updates: DocumentListParamUpdates) => void
}

export function DocumentListPagination({ meta, hrefFor, setParams }: Props) {
  const { page, pageSize, total, totalPages } = meta
  const first = (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)

  // page 1 is the default, so it is left out of the URL
  const pageUpdate = (target: number) => ({ page: target === 1 ? undefined : target })

  // links keep a real href (open in new tab works); a plain click navigates client side
  const linkProps = (target: number) => ({
    href: hrefFor(pageUpdate(target)),
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      setParams(pageUpdate(target))
    },
  })
  const disabledProps = { 'aria-disabled': true, className: 'pointer-events-none opacity-50' }

  return (
    <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Showing {first}-{last} of {total}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows per page</span>
          <Select
            items={PAGE_SIZE_OPTIONS}
            value={String(pageSize)}
            onValueChange={(value) => value && setParams({ pageSize: value, page: undefined })}
          >
            <SelectTrigger size="sm" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious {...(page > 1 ? linkProps(page - 1) : disabledProps)} />
            </PaginationItem>
            {getPageItems(page, totalPages).map((item, i) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink isActive={item === page} {...linkProps(item)}>
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext {...(page < totalPages ? linkProps(page + 1) : disabledProps)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}

/** First, last, and the pages next to the current one; gaps become ellipses. */
function getPageItems(page: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)

  const start = Math.max(2, page - 1)
  const end = Math.min(totalPages - 1, page + 1)
  const items: (number | 'ellipsis')[] = [1]
  if (start > 2) items.push('ellipsis')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < totalPages - 1) items.push('ellipsis')
  items.push(totalPages)
  return items
}
