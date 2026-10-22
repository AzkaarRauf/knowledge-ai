'use client'

import { revalidateLogic } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Building2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { TextFieldView } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { departmentQueryOptions } from '@/features/departments/api/queries'
import { DepartmentFormFields, isNameTakenError, setNameTakenError } from '@/features/departments/components/DepartmentFormFields'
import { useDeleteDepartmentMutation } from '@/features/departments/hooks/useDeleteDepartmentMutation'
import { useUpdateDepartmentMutation } from '@/features/departments/hooks/useUpdateDepartmentMutation'
import { type Department, type DepartmentFormInput, DepartmentFormSchema } from '@/features/departments/schemas'
import { useAppForm } from '@/hooks/useAppForm'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'

export function DepartmentDetail({ departmentId }: { departmentId: string }) {
  const { data: department, isPending } = useQuery(departmentQueryOptions(departmentId))

  if (isPending) return <DepartmentDetailSkeleton />
  if (!department) {
    // load error is already toasted globally; just offer a way back
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 />
            </EmptyMedia>
            <EmptyTitle>Department not found</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/departments" />}>
              Back to departments
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return <DepartmentForm key={department.id} department={department} />
}

function DepartmentForm({ department }: { department: Department }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const updateMutation = useUpdateDepartmentMutation()
  const deleteMutation = useDeleteDepartmentMutation()

  const form = useAppForm({
    defaultValues: { name: department.name } as DepartmentFormInput,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: DepartmentFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') console.error('Department form invalid', formApi.state.errors)
    },
    onSubmit: async ({ value, formApi }) => {
      const parsed = DepartmentFormSchema.parse(value)
      const res = await safe(updateMutation.mutateAsync({ id: department.id, ...parsed }))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isNameTakenError(res)) return setNameTakenError(formApi, parsed.name)
      if (isError(res)) return toast.error(getErrorMessage(res))
      toast.success('Department updated')
      form.reset(value) // also makes `value` the new defaultValues
      setIsEditing(false)
    },
  })

  const handleFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isEditing) return
    void form.handleSubmit()
  }

  const handleCancel = () => {
    if (!isEditing) return router.push('/departments')
    form.reset()
    setIsEditing(false)
  }

  async function handleDeleteConfirm() {
    setConfirmingDelete(false)
    const res = await safe(deleteMutation.mutateAsync({ id: department.id }))
    if (isError(res)) return toast.error(getErrorMessage(res))
    toast.success(`"${department.name}" deleted`)
    router.replace('/departments')
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">Department</h1>

      <form onSubmit={handleFormSubmit} noValidate>
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TextFieldView label="Department ID" value={department.id} disabled copyable />
            <TextFieldView label="Created" value={new Date(department.createdAt).toLocaleString()} disabled />
            <TextFieldView label="Updated" value={new Date(department.updatedAt).toLocaleString()} disabled />
          </div>
          <DepartmentFormFields form={form} disabled={!isEditing} />
        </div>

        <div className="mt-4 flex justify-end gap-3">
          {!isEditing && (
            <Button
              type="button"
              variant="destructive"
              className="mr-auto"
              disabled={deleteMutation.isPending}
              onClick={() => setConfirmingDelete(true)}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          )}
          {isEditing ? (
            <form.AppForm>
              <form.SubscribeButton label="Update" submittingLabel="Updating..." />
            </form.AppForm>
          ) : (
            <Button type="button" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>

      <ConfirmationDialog
        open={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        onAccept={handleDeleteConfirm}
        title="Delete department?"
        description={`This will permanently delete "${department.name}".`}
        confirmText="Delete"
        destructive
      />
    </div>
  )
}

/** Mirrors the detail layout: title, form card with two rows, action row. */
export function DepartmentDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading department" className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <Skeleton className="h-7 w-32" />
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FieldSkeleton />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

function FieldSkeleton() {
  return (
    <div className="grid gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9" />
    </div>
  )
}
