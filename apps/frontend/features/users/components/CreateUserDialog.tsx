'use client'

import { revalidateLogic } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { isError, safe } from 'shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { departmentsQueryOptions } from '@/features/departments/api/queries'
import { toDepartmentOptions } from '@/features/users/components/department-options'
import {
  isEmailTakenError,
  setEmailTakenError,
  USER_FORM_FIELDS,
  UserFormFields,
} from '@/features/users/components/UserFormFields'
import { useCreateUserMutation } from '@/features/users/hooks/useCreateUserMutation'
import { type CreateUserFormInput, CreateUserFormSchema, ROLE_OPTIONS } from '@/features/users/schemas'
import { useAppForm } from '@/hooks/useAppForm'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'

const emptyUserForm: CreateUserFormInput = { name: '', email: '', departmentId: '', role: 'USER' }

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New user
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
        </DialogHeader>
        {/* popup unmounts on close, so each open starts with a fresh form */}
        <CreateUserForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function CreateUserForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateUserMutation()
  const { data: departmentOptions = [] } = useQuery({ ...departmentsQueryOptions(), select: toDepartmentOptions })

  const form = useAppForm({
    defaultValues: emptyUserForm,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: CreateUserFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') console.error('User form invalid', formApi.state.errors)
    },
    onSubmit: async ({ value, formApi }) => {
      const parsed = CreateUserFormSchema.parse(value)
      const res = await safe(createMutation.mutateAsync(parsed))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isEmailTakenError(res)) return setEmailTakenError(formApi, parsed.email)
      if (isError(res)) return toast.error(getErrorMessage(res))
      toast.success(`"${res.name}" created`)
      onDone()
    },
  })

  const handleFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void form.handleSubmit()
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate className="grid gap-4">
      <UserFormFields form={form} fields={USER_FORM_FIELDS} disabled={false} departmentOptions={departmentOptions} />
      {/* role is set once here; it cannot be changed later */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <form.AppField name="role">{(f) => <f.SelectField label="Role" options={ROLE_OPTIONS} required />}</form.AppField>
      </div>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <form.AppForm>
          <form.SubscribeButton label="Create" submittingLabel="Creating..." />
        </form.AppForm>
      </DialogFooter>
    </form>
  )
}
