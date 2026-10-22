'use client'

import { revalidateLogic } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { Upload } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { DOCUMENT_MIME_TYPES, isError, safe } from 'shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { departmentsQueryOptions } from '@/features/departments/api/queries'
import { useUploadDocumentMutation } from '@/features/documents/hooks/useUploadDocumentMutation'
import { type DocumentUploadFormInput, DocumentUploadFormSchema } from '@/features/documents/schemas'
import { useAppForm } from '@/hooks/useAppForm'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'

export function DocumentUploadDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Upload />
        Upload document
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
          <DialogDescription>PDF, DOCX or text files, up to 25MB.</DialogDescription>
        </DialogHeader>
        {/* popup unmounts on close, so each open starts with a fresh form */}
        <DocumentUploadForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

function DocumentUploadForm({ onDone }: { onDone: () => void }) {
  const uploadMutation = useUploadDocumentMutation()
  const { data: departments = [], isPending: departmentsPending } = useQuery(departmentsQueryOptions())
  const departmentOptions = [{ value: null, label: 'No department' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]

  const form = useAppForm({
    defaultValues: { file: null, departmentId: null } as DocumentUploadFormInput,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: DocumentUploadFormSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') console.error('Document upload form invalid', formApi.state.errors)
    },
    onSubmit: async ({ value, formApi }) => {
      const parsed = DocumentUploadFormSchema.parse(value)
      const res = await safe(uploadMutation.mutateAsync(parsed))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isError(res)) return toast.error(getErrorMessage(res))
      if (res.isNew) toast.success(`"${res.document.filename}" uploaded`)
      else toast.info(`"${res.document.filename}" is already uploaded`)
      onDone()
    },
  })

  const handleFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void form.handleSubmit()
  }

  return (
    <form onSubmit={handleFormSubmit} noValidate className="grid gap-4">
      <form.AppField name="file">
        {(f) => <f.FileField label="File" accept={DOCUMENT_MIME_TYPES.join(',')} required />}
      </form.AppField>
      {departmentsPending ? (
        <div className="grid gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9" />
        </div>
      ) : (
        <form.AppField name="departmentId">
          {(f) => <f.SelectField label="Department" options={departmentOptions} placeholder="No department" />}
        </form.AppField>
      )}

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
        <form.AppForm>
          <form.SubscribeButton label="Upload" submittingLabel="Uploading..." />
        </form.AppForm>
      </DialogFooter>
    </form>
  )
}
