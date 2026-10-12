'use client'

import { useId, type ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFieldContext } from '@/hooks/form-context'
import { cn } from '@/lib/utils'
import { FieldShell } from './FieldShell'
import { formatFieldErrors, readOnlyClassName } from './field-utils'

export type SelectOption = { value: string; label: string }

type SelectFieldProps = {
  label: string
  options: readonly SelectOption[]
  placeholder?: string
  description?: ReactNode
  required?: boolean
  disabled?: boolean
  className?: string
}

export function SelectField({
  label,
  options,
  placeholder,
  description,
  required,
  disabled,
  className,
}: SelectFieldProps) {
  const field = useFieldContext<string | null>()
  const id = useId()
  const error = formatFieldErrors(field.state.meta.errors)

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      description={description}
      className={className}
    >
      <Select
        name={field.name}
        items={options}
        // An empty string means "nothing picked": Base UI shows the placeholder only for null.
        value={field.state.value || null}
        disabled={disabled}
        onValueChange={(value) => field.handleChange(value)}
        onOpenChange={(open) => {
          if (!open) field.handleBlur()
        }}
      >
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn('h-9 w-full data-[size=default]:h-9', readOnlyClassName)}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}
