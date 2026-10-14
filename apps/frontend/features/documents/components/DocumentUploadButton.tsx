'use client'

import { Upload } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { DOCUMENT_MIME_TYPES, isError, safe } from 'shared'
import { Button } from '@/components/ui/button'
import { UploadDocumentRequestSchema } from '@/features/documents/schemas'
import { useUploadDocumentMutation } from '@/features/documents/hooks/useUploadDocumentMutation'
import { getErrorMessage } from '@/lib/errors'

export function DocumentUploadButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadDocumentMutation()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // clear so picking the same file again still fires change
    e.target.value = ''
    if (!file) return

    const parsed = UploadDocumentRequestSchema.safeParse({ file })
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message)

    const res = await safe(uploadMutation.mutateAsync(parsed.data))
    if (isError(res)) return toast.error(getErrorMessage(res))
    if (!res.isNew) return toast.info(`"${res.document.filename}" is already uploaded`)
    toast.success(`"${res.document.filename}" uploaded`)
  }

  return (
    <>
      <input ref={inputRef} type="file" accept={DOCUMENT_MIME_TYPES.join(',')} className="hidden" onChange={handleFileChange} />
      <Button onClick={() => inputRef.current?.click()} disabled={uploadMutation.isPending}>
        <Upload />
        {uploadMutation.isPending ? 'Uploading...' : 'Upload document'}
      </Button>
    </>
  )
}
