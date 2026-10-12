'use client'

import { useId, type ReactNode } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useFieldContext } from '@/hooks/form-context'
import { cn } from '@/lib/utils'
import { formatFieldErrors } from './field-utils'

type CheckboxFieldProps = {
  label: string
  description?: ReactNode
  disabled?: boolean
  className?: string
}

export function CheckboxField({ label, description, disabled, className }: CheckboxFieldProps) {
  const field = useFieldContext<boolean>()
  const id = useId()
  const error = formatFieldErrors(field.state.meta.errors)

  return (
    <div className={cn('grid gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          name={field.name}
          checked={field.state.value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          onBlur={field.handleBlur}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
        <Label htmlFor={id}>{label}</Label>
      </div>
      {description && <p className="pl-6 text-sm text-muted-foreground">{description}</p>}
      {error && (
        <p className="pl-6 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
