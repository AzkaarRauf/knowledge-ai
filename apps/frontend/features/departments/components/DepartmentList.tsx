'use client'

import { useQuery } from '@tanstack/react-query'
import { Building2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { departmentsQueryOptions } from '@/features/departments/api/queries'
import { useDeleteDepartmentMutation } from '@/features/departments/hooks/useDeleteDepartmentMutation'
import type { Department } from '@/features/departments/schemas'
import { getErrorMessage } from '@/lib/errors'

export function DepartmentList() {
  const { data: departments = [], isPending } = useQuery(departmentsQueryOptions())
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null)
  const deleteMutation = useDeleteDepartmentMutation()

  async function handleDeleteConfirm() {
    if (!departmentToDelete) return
    const { id, name } = departmentToDelete
    setDepartmentToDelete(null)
    const res = await safe(deleteMutation.mutateAsync({ id }))
    if (isError(res)) return toast.error(getErrorMessage(res))
    toast.success(`"${name}" deleted`)
  }

  if (isPending) return <DepartmentTableSkeleton />

  return (
    <>
      {departments.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>No departments yet</EmptyTitle>
            <EmptyDescription>Create a department to get started.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">
                    <Link href={`/departments/${department.id}`} className="underline-offset-4 hover:underline">
                      {department.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(department.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Delete ${department.name}`}
                            disabled={deleteMutation.isPending}
                            onClick={() => setDepartmentToDelete(department)}
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
        open={departmentToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setDepartmentToDelete(null)
        }}
        onAccept={handleDeleteConfirm}
        title="Delete department?"
        description={`This will permanently delete "${departmentToDelete?.name}".`}
        confirmText="Delete"
        destructive
      />
    </>
  )
}

function DepartmentTableSkeleton() {
  return (
    <div role="status" aria-label="Loading departments" className="rounded-lg border bg-card p-2">
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-9" />
        ))}
      </div>
    </div>
  )
}
