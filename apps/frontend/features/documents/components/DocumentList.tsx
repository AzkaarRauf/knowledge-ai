'use client'

import { useQuery } from '@tanstack/react-query'
import { FileText, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { documentsQueryOptions } from '@/features/documents/api/queries'
import { useDeleteDocumentMutation } from '@/features/documents/hooks/useDeleteDocumentMutation'
import { type Document } from '@/features/documents/schemas'
import { getErrorMessage } from '@/lib/errors'

export function DocumentList() {
  const { data: documents = [], isPending } = useQuery(documentsQueryOptions())
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null)
  const deleteMutation = useDeleteDocumentMutation()

  async function handleDeleteConfirm() {
    if (!documentToDelete) return
    const { id, filename } = documentToDelete
    setDocumentToDelete(null)
    const res = await safe(deleteMutation.mutateAsync({ id }))
    if (isError(res)) return toast.error(getErrorMessage(res))
    toast.success(`"${filename}" deleted`)
  }

  if (isPending) return <DocumentListSkeleton />

  return (
    <>
      {documents.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No documents yet</EmptyTitle>
            <EmptyDescription>Upload a PDF, DOCX or text file to get started.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium whitespace-normal break-all">
                    {document.filename}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(document.createdAt).toLocaleString()}
                  </TableCell>
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
    </>
  )
}

function DocumentListSkeleton() {
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
