'use client'

import { revalidateLogic } from '@tanstack/react-form'
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
import { isNameTakenError, setNameTakenError } from '@/features/departments/components/DepartmentFormFields'
import { useCreateDepartmentMutation } from '@/features/departments/hooks/useCreateDepartmentMutation'
import { type DepartmentFormInput, DepartmentFormSchema } from '@/features/departments/schemas'
import { useAppForm } from '@/hooks/useAppForm'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'

export function CreateDepartmentDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        New department
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New department</DialogTitle>
        </DialogHeader>
        {/* popup unmounts on close, so each open starts with a fresh form */}
        <CreateDepartmentForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function CreateDepartmentForm({ onDone }: { onDone: () => void }) {
  const createMutation = useCreateDepartmentMutation()

  const form = useAppForm({
    defaultValues: { name: '' } as DepartmentFormInput,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: DepartmentFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') console.error('Department form invalid', formApi.state.errors)
    },
    onSubmit: async ({ value, formApi }) => {
      const parsed = DepartmentFormSchema.parse(value)
      const res = await safe(createMutation.mutateAsync(parsed))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isNameTakenError(res)) return setNameTakenError(formApi, parsed.name)
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
      <form.AppField name="name">{(f) => <f.TextField label="Name" required />}</form.AppField>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <form.AppForm>
          <form.SubscribeButton label="Create" submittingLabel="Creating..." />
        </form.AppForm>
      </DialogFooter>
    </form>
  )
}
