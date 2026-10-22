'use client'

import { useId } from 'react'
import { Input } from '@/components/ui/input'
import { useFieldContext } from '@/hooks/form-context'
import { FieldShell } from './FieldShell'
import { formatFieldErrors } from './field-utils'

type FileFieldProps = {
  label: string
  /** e.g. "application/pdf,text/plain" */
  accept?: string
  description?: React.ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FileField({ label, accept, description, required, disabled, className }: FileFieldProps) {
  const field = useFieldContext<File | null>()
  const id = useId()
  const error = formatFieldErrors(field.state.meta.errors)

  return (
    <FieldShell id={id} label={label} required={required} error={error} description={description} className={className}>
      {/* file inputs can't be controlled, so the value only flows out */}
      <Input
        id={id}
        name={field.name}
        type="file"
        accept={accept}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.files?.[0] ?? null)}
      />
    </FieldShell>
  )
}
