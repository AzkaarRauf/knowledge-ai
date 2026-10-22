'use client'

import type { AnyFormApi } from '@tanstack/react-form'
import type { DepartmentFormInput } from '@/features/departments/schemas'
import { withForm } from '@/hooks/useAppForm'
import { ApiError } from '@/lib/errors'

/** Backend sends 409 when another department already has this name. */
export const isNameTakenError = (error: unknown) => error instanceof ApiError && error.status === 409

/** Shows the 409 on the name field; the next change clears it. */
export function setNameTakenError(formApi: AnyFormApi, name: string) {
  formApi.setErrorMap({ onServer: { fields: { name: `A department named "${name}" already exists` } } })
}

export const DepartmentFormFields = withForm({
  defaultValues: { name: '' } as DepartmentFormInput, // type-only; not used at runtime
  props: { disabled: false },
  render: function Render({ form, disabled }) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <form.AppField name="name">{(f) => <f.TextField label="Name" disabled={disabled} required />}</form.AppField>
      </div>
    )
  },
})
