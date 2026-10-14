'use client'

import { Button } from '@/components/ui/button'
import { useFormContext } from '@/hooks/form-context'

type SubscribeButtonProps = {
  label: string
  submittingLabel?: string
  className?: string
}

/** Submit button that disables while the form cannot submit, is submitting, or is unchanged. */
export function SubscribeButton({ label, submittingLabel = label, className }: SubscribeButtonProps) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isDefaultValue] as const}>
      {([canSubmit, isSubmitting, isDefaultValue]) => (
        <Button type="submit" className={className} disabled={!canSubmit || isSubmitting || isDefaultValue}>
          {isSubmitting ? submittingLabel : label}
        </Button>
      )}
    </form.Subscribe>
  )
}
