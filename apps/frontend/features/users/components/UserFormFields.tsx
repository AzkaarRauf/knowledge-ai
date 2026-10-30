'use client'

import type { AnyFormApi } from '@tanstack/react-form'
import type { SelectOption } from '@/components/form/SelectField'
import type { EditUserFormInput } from '@/features/users/schemas'
import { withFieldGroup } from '@/hooks/useAppForm'
import { ApiError } from '@/lib/errors'

/** Backend sends 409 when another user already has this email. */
export const isEmailTakenError = (error: unknown) => error instanceof ApiError && error.status === 409

/** Shows the 409 on the email field; the next change clears it. */
export function setEmailTakenError(formApi: AnyFormApi, email: string) {
  formApi.setErrorMap({ onServer: { fields: { email: `A user with email "${email}" already exists` } } })
}

/** Maps the group onto a form whose fields use the same names. */
export const USER_FORM_FIELDS = { name: 'name', email: 'email', departmentId: 'departmentId' } as const

/**
 * Fields both create and edit have. Create adds role on its own.
 * A field group, not `withForm`, because the two forms have different shapes.
 */
export const UserFormFields = withFieldGroup({
  defaultValues: { name: '', email: '', departmentId: '' } as EditUserFormInput, // type-only; not used at runtime
  props: { disabled: false, departmentOptions: [] as readonly SelectOption[] },
  render: function Render({ group, disabled, departmentOptions }) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <group.AppField name="name">{(f) => <f.TextField label="Name" disabled={disabled} required />}</group.AppField>
        <group.AppField name="email">
          {(f) => <f.TextField label="Email" type="email" autoComplete="off" disabled={disabled} required />}
        </group.AppField>
        <group.AppField name="departmentId">
          {(f) => (
            <f.SelectField
              label="Department"
              options={departmentOptions}
              placeholder="Select a department"
              disabled={disabled}
              required
            />
          )}
        </group.AppField>
      </div>
    )
  },
})
