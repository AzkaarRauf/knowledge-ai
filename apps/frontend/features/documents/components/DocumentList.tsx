'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, ArrowUpDown, FileText, SearchX, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DOCUMENT_SORT_FIELDS, isError, safe } from 'shared'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { documentsQueryOptions } from '@/features/documents/api/queries'
import { DocumentListPagination } from '@/features/documents/components/DocumentListPagination'
import { DocumentListToolbar } from '@/features/documents/components/DocumentListToolbar'
import { useDeleteDocumentMutation } from '@/features/documents/hooks/useDeleteDocumentMutation'
import { useDocumentListParams } from '@/features/documents/hooks/useDocumentListParams'
import { type Document, type ListDocumentsQuery } from '@/features/documents/schemas'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'

type SortField = (typeof DOCUMENT_SORT_FIELDS)[number]

export function DocumentList() {
  const { params, query, hrefFor, setParams } = useDocumentListParams()
  // keep showing the current page while the next one loads, instead of flashing skeletons
  const { data, isPending, isPlaceholderData } = useQuery({
    ...documentsQueryOptions(params),
    placeholderData: keepPreviousData,
  })
  const documents = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 0
  const hasFilters = Boolean(query.search || query.createdFrom || query.createdTo)

  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const deleteMutation = useDeleteDocumentMutation()

  // deleting the last row of the last page leaves us past the end, so step back
  useEffect(() => {
    if (!isPlaceholderData && totalPages > 0 && query.page > totalPages) {
      setParams({ page: totalPages === 1 ? undefined : totalPages }, { replace: true })
    }
  }, [isPlaceholderData, totalPages, query.page, setParams])

  async function handleDeleteConfirm() {
    if (!documentToDelete) return
    const { id, filename } = documentToDelete
    setDocumentToDelete(null)
    const res = await safe(deleteMutation.mutateAsync({ id }))
    if (isError(res)) return toast.error(getErrorMessage(res))
    toast.success(`"${filename}" deleted`)
  }

  function handleSort(field: SortField) {
    const sortOrder =
      query.sortBy === field ? (query.sortOrder === 'asc' ? 'desc' : 'asc') : field === 'filename' ? 'asc' : 'desc'
    setParams({ sortBy: field, sortOrder, page: undefined })
  }

  function clearFilters() {
    setParams({ search: undefined, createdFrom: undefined, createdTo: undefined, page: undefined })
  }

  // a brand new user has nothing to search, so skip the toolbar
  const isLibraryEmpty = !isPending && !hasFilters && data?.meta.total === 0

  return (
    <div className="space-y-3">
      {!isLibraryEmpty && <DocumentListToolbar query={query} setParams={setParams} />}

      {isPending ? (
        <DocumentTableSkeleton />
      ) : documents.length === 0 ? (
        hasFilters ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SearchX />
              </EmptyMedia>
              <EmptyTitle>No matching documents</EmptyTitle>
              <EmptyDescription>Try a different search or date range.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No documents yet</EmptyTitle>
              <EmptyDescription>Upload a PDF, DOCX or text file to get started.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <>
          <div
            aria-busy={isPlaceholderData}
            className={cn('rounded-lg border bg-card transition-opacity', isPlaceholderData && 'opacity-60')}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="filename" label="Name" query={query} onSort={handleSort} />
                  <TableHead>Department</TableHead>
                  <SortableHead field="createdAt" label="Uploaded" query={query} onSort={handleSort} />
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium whitespace-normal break-all">{document.filename}</TableCell>
                    <TableCell className={cn(!document.department && 'text-muted-foreground')}>
                      {document.department?.name ?? 'None'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(document.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Delete ${document.filename}`}
                              disabled={deleteMutation.isPending}
                              onClick={() => setDocumentToDelete(document)}
                            />
                          }
                        >
                          <Trash2 />
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data && <DocumentListPagination meta={data.meta} hrefFor={hrefFor} setParams={setParams} />}
        </>
      )}

      <ConfirmationDialog
        open={documentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setDocumentToDelete(null)
        }}
        onAccept={handleDeleteConfirm}
        title="Delete document?"
        description={`This will permanently delete "${documentToDelete?.filename}".`}
        confirmText="Delete"
        destructive
      />
    </div>
  )
}

function SortableHead({
  field,
  label,
  query,
  onSort,
}: {
  field: SortField
  label: string
  query: ListDocumentsQuery
  onSort: (field: SortField) => void
}) {
  const isActive = query.sortBy === field
  const Icon = !isActive ? ArrowUpDown : query.sortOrder === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead aria-sort={isActive ? (query.sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => onSort(field)}>
        {label}
        <Icon data-icon="inline-end" className={cn(!isActive && 'text-muted-foreground')} />
      </Button>
    </TableHead>
  )
}

function DocumentTableSkeleton() {
  return (
    <div role="status" aria-label="Loading documents" className="rounded-lg border bg-card p-2">
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    </div>
  )
}

/** Fallback while the URL params are read: toolbar row + table. */
export function DocumentListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-9 sm:w-xs" />
        <Skeleton className="h-9 sm:w-36" />
      </div>
      <DocumentTableSkeleton />
    </div>
  )
}
