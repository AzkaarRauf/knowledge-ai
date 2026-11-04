'use client'

import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { Badge, type badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { documentDownloadUrlQueryOptions, documentsQueryOptions } from '@/features/documents/api/queries'
import { DocumentListPagination } from '@/features/documents/components/DocumentListPagination'
import { DocumentListToolbar } from '@/features/documents/components/DocumentListToolbar'
import { useDeleteDocumentMutation } from '@/features/documents/hooks/useDeleteDocumentMutation'
import { useDocumentListParams } from '@/features/documents/hooks/useDocumentListParams'
import { type Document, type DocumentStatus, type ListDocumentsQuery } from '@/features/documents/schemas'
import { getErrorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { type VariantProps } from 'class-variance-authority'
import { ArrowDown, ArrowUp, ArrowUpDown, Download, FileText, Loader2, SearchX, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DOCUMENT_SORT_FIELDS, isError, safe } from 'shared'
import { toast } from 'sonner'

type BadgeProps = VariantProps<typeof badgeVariants>

type SortField = (typeof DOCUMENT_SORT_FIELDS)[number]

const isInFlight = ({ status }: Document) => status === 'PENDING' || status === 'PROCESSING'

// canManage shows admin-only actions (delete); download is for everyone
export function DocumentList({ canManage }: { canManage: boolean }) {
  const { params, query, hrefFor, setParams } = useDocumentListParams()
  const { data, isPending } = useQuery({
    ...documentsQueryOptions(params),
    // the worker updates status in the background, so poll until every doc on the page settles
    refetchInterval: (q) => (q.state.data?.data.some(isInFlight) ? 3000 : false),
  })
  const documents = data?.data ?? []
  const totalPages = data?.meta.totalPages ?? 0
  const hasFilters = Boolean(query.search || query.createdFrom || query.createdTo)

  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const deleteMutation = useDeleteDocumentMutation()
  const queryClient = useQueryClient()
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // deleting the last row of the last page leaves us past the end, so step back
  useEffect(() => {
    if (totalPages > 0 && query.page > totalPages) {
      setParams({ page: totalPages === 1 ? undefined : totalPages }, { replace: true })
    }
  }, [totalPages, query.page, setParams])

  async function handleDeleteConfirm() {
    if (!documentToDelete) return
    const { id, filename } = documentToDelete
    setDocumentToDelete(null)
    const res = await safe(deleteMutation.mutateAsync({ id }))
    if (isError(res)) return toast.error(getErrorMessage(res))
    toast.success(`"${filename}" deleted`)
  }

  async function handleDownload({ id }: Document) {
    setDownloadingId(id)
    const res = await safe(queryClient.fetchQuery(documentDownloadUrlQueryOptions(id)))
    setDownloadingId(null)
    // load errors already toast from the global QueryCache handler
    if (isError(res)) return
    // the url is sent as an attachment, so the browser downloads it and stays on this page
    window.location.assign(res.url)
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
          <Empty className="border bg-card py-16">
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
          <Empty className="border bg-card py-16">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>No documents yet</EmptyTitle>
              <EmptyDescription>
                {canManage ? 'Upload a PDF, DOCX or text file to get started.' : 'No documents have been shared yet.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      ) : (
        <>
          <div className={'overflow-hidden rounded-xl border bg-card shadow-xs'}>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead field="filename" label="Name" query={query} onSort={handleSort} />
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <SortableHead field="createdAt" label="Uploaded" query={query} onSort={handleSort} />
                  <TableHead className={canManage ? 'w-20' : 'w-12'}>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-3">
                        <FileTypeIcon filename={document.filename} />
                        <span className="font-medium break-all">{document.filename}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DocumentStatusBadge status={document.status} />
                    </TableCell>
                    <TableCell>
                      {document.department ? (
                        <Badge variant="outline">{document.department.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{new Date(document.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Download ${document.filename}`}
                              disabled={downloadingId === document.id}
                              onClick={() => handleDownload(document)}
                            />
                          }
                        >
                          <Download />
                        </TooltipTrigger>
                        <TooltipContent>Download</TooltipContent>
                      </Tooltip>
                      {canManage && (
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
                      )}
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

const STATUS_BADGE = {
  PENDING: { label: 'Queued', variant: 'secondary' },
  PROCESSING: { label: 'Processing', variant: 'default' },
  DONE: { label: 'Ready', variant: 'success' },
  FAILED: { label: 'Failed', variant: 'destructive' },
} as const satisfies Record<DocumentStatus, { label: string; variant: BadgeProps['variant'] }>

function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { label, variant } = STATUS_BADGE[status]
  if (status === 'FAILED') {
    return (
      <Tooltip>
        <TooltipTrigger render={<Badge variant={variant} tabIndex={0} />}>{label}</TooltipTrigger>
        <TooltipContent>Could not be processed. Delete and upload again.</TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Badge variant={variant}>
      {status === 'PROCESSING' && <Loader2 className="size-3 animate-spin" />}
      {label}
    </Badge>
  )
}

/** Small tile with the file extension, e.g. PDF. */
function FileTypeIcon({ filename }: { filename: string }) {
  const ext = filename.includes('.') ? filename.split('.').pop()!.slice(0, 4) : ''
  return (
    <span className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
      <FileText className="size-4" />
      {ext && (
        <span className="absolute -right-1 -bottom-1 rounded-sm bg-card px-0.5 text-[8px] leading-tight font-bold uppercase ring-1 ring-border">
          {ext}
        </span>
      )}
    </span>
  )
}

function DocumentTableSkeleton() {
  return (
    <div role="status" aria-label="Loading documents" className="overflow-hidden rounded-xl border bg-card shadow-xs p-2">
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
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
