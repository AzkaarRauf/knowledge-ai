import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type FieldShellProps = {
  id: string
  label: string
  required?: boolean
  error?: string
  description?: ReactNode
  className?: string
  children: ReactNode
}

export function FieldShell({
  id,
  label,
  required,
  error,
  description,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn('grid content-start gap-2', className)}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {description && !error && <p className="text-sm text-muted-foreground">{description}</p>}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
