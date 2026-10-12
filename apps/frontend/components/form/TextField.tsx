'use client'

import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { CheckIcon, CopyIcon } from 'lucide-react'
import { useId, useState, type HTMLInputTypeAttribute, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { useFieldContext } from '@/hooks/form-context'
import { cn } from '@/lib/utils'
import { FieldShell } from './FieldShell'
import { formatFieldErrors, readOnlyClassName } from './field-utils'

type TextFieldProps = {
  label: string
  type?: HTMLInputTypeAttribute
  placeholder?: string
  description?: ReactNode
  required?: boolean
  disabled?: boolean
  maxLength?: number
  autoComplete?: string
  autoFocus?: boolean
  /** Adds a copy-to-clipboard button (identifiers). */
  copyable?: boolean
  className?: string
}

export function TextField({ label, className, ...inputProps }: TextFieldProps) {
  const field = useFieldContext<string>()
  const error = formatFieldErrors(field.state.meta.errors)

  return (
    <TextInputView
      label={label}
      name={field.name}
      value={field.state.value}
      error={error}
      onBlur={field.handleBlur}
      onChange={field.handleChange}
      className={className}
      {...inputProps}
    />
  )
}

type TextInputViewProps = TextFieldProps & {
  value: string
  name?: string
  error?: string
  onChange?: (value: string) => void
  onBlur?: () => void
}

/** The presentational input behind `TextField` and `TextFieldView`. */
export function TextInputView({
  label,
  value,
  error,
  onChange,
  onBlur,
  description,
  required,
  copyable,
  className,
  type,
  ...inputProps
}: TextInputViewProps) {
  const id = useId()
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy to the clipboard.')
    }
  }

  const controlProps = {
    value,
    readOnly: !onChange,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
    onBlur,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
    ...inputProps,
  }

  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      error={error}
      description={description}
      className={className}
    >
      <div className="flex gap-2">
        {type === 'password' ? (
          <InputGroup className="h-9">
            <InputGroupInput id={id} type={revealed ? 'text' : 'password'} {...controlProps} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label={revealed ? 'Hide password' : 'Show password'}
                title={revealed ? 'Hide password' : 'Show password'}
                disabled={inputProps.disabled}
                onClick={() => setRevealed((r) => !r)}
              >
                {revealed ? <EyeSlashIcon /> : <EyeIcon />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        ) : (
          <Input id={id} type={type} className={cn('h-9', readOnlyClassName)} {...controlProps} />
        )}
        {copyable && (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label={`Copy ${label}`}
            title={`Copy ${label}`}
            disabled={!value}
            onClick={copy}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </Button>
        )}
      </div>
    </FieldShell>
  )
}
