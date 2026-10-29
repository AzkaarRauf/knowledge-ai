'use client'

import { revalidateLogic } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import { TextFieldView } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { departmentsQueryOptions } from '@/features/departments/api/queries'
import { userQueryOptions } from '@/features/users/api/queries'
import { toDepartmentOptions } from '@/features/users/components/department-options'
import {
  isEmailTakenError,
  setEmailTakenError,
  USER_FORM_FIELDS,
  UserFormFields,
} from '@/features/users/components/UserFormFields'
import { useUpdateUserMutation } from '@/features/users/hooks/useUpdateUserMutation'
import { type EditUserFormInput, EditUserFormSchema, roleLabel, type User } from '@/features/users/schemas'
import { useAppForm } from '@/hooks/useAppForm'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'

export function UserDetail({ userId }: { userId: string }) {
  const { data: user, isPending } = useQuery(userQueryOptions(userId))

  if (isPending) return <UserDetailSkeleton />
  if (!user) {
    // load error is already toasted globally; just offer a way back
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRound />
            </EmptyMedia>
            <EmptyTitle>User not found</EmptyTitle>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link href="/users" />}>
              Back to users
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return <UserForm key={user.id} user={user} />
}

const userToForm = (user: User): EditUserFormInput => ({
  name: user.name,
  email: user.email,
  departmentId: user.departmentId,
})

function UserForm({ user }: { user: User }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const updateMutation = useUpdateUserMutation()
  const { data: departmentOptions = [] } = useQuery({ ...departmentsQueryOptions(), select: toDepartmentOptions })

  const form = useAppForm({
    defaultValues: userToForm(user),
    validationLogic: revalidateLogic(),
    validators: { onDynamic: EditUserFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') console.error('User form invalid', formApi.state.errors)
    },
    onSubmit: async ({ value, formApi }) => {
      const parsed = EditUserFormSchema.parse(value)
      const res = await safe(updateMutation.mutateAsync({ id: user.id, ...parsed }))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isEmailTakenError(res)) return setEmailTakenError(formApi, parsed.email)
      if (isError(res)) return toast.error(getErrorMessage(res))
      toast.success('User updated')
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
    if (!isEditing) return router.push('/users')
    form.reset()
    setIsEditing(false)
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <h1 className="text-xl font-semibold">User</h1>

      <form onSubmit={handleFormSubmit} noValidate>
        <div className="space-y-4 rounded-lg border bg-card p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <TextFieldView label="User ID" value={user.id} disabled copyable />
            <TextFieldView label="Created" value={new Date(user.createdAt).toLocaleString()} disabled />
            <TextFieldView label="Updated" value={new Date(user.updatedAt).toLocaleString()} disabled />
          </div>
          <UserFormFields form={form} fields={USER_FORM_FIELDS} disabled={!isEditing} departmentOptions={departmentOptions} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* role cannot be changed for now */}
            <TextFieldView label="Role" value={roleLabel(user.role)} disabled />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3">
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
    </div>
  )
}

/** Mirrors the detail layout: title, form card with three rows, action row. */
export function UserDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading user" className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <Skeleton className="h-7 w-32" />
      <div className="space-y-4 rounded-lg border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
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
