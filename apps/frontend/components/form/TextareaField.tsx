'use client'

import { useId } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useFieldContext } from '@/hooks/form-context'
import { FieldShell } from './FieldShell'
import { formatFieldErrors, readOnlyClassName } from './field-utils'

type TextareaFieldProps = {
  label: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  maxLength?: number
  rows?: number
  className?: string
}

export function TextareaField({ label, required, className, rows = 3, ...textareaProps }: TextareaFieldProps) {
  const field = useFieldContext<string>()
  const id = useId()
  const error = formatFieldErrors(field.state.meta.errors)

  return (
    <FieldShell id={id} label={label} required={required} error={error} className={className}>
      <Textarea
        id={id}
        name={field.name}
        rows={rows}
        className={readOnlyClassName}
        value={field.state.value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        {...textareaProps}
      />
    </FieldShell>
  )
}
