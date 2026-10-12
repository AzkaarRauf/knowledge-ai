'use client'

import { revalidateLogic } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'sonner'
import type { z } from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { RegisterRequestSchema } from '@/features/auth/auth.schema'
import { useRegisterMutation } from '@/features/auth/hooks/register-mutation.hook'
import { publicDepartmentsQueryOptions } from '@/features/departments/api/queries'
import type { PublicDepartment } from '@/features/departments/schemas'
import { useAppForm } from '@/hooks/useAppForm'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'
import { isError, safe } from '@/lib/safe'

type RegisterFormInput = z.input<typeof RegisterRequestSchema>

const toDepartmentOptions = (departments: PublicDepartment[]) =>
  departments.map((department) => ({ value: department.id, label: department.name }))

export function RegisterForm() {
  const registerMutation = useRegisterMutation()
  const { data: departmentOptions = [], isPending: departmentsPending } = useQuery({
    ...publicDepartmentsQueryOptions(),
    select: toDepartmentOptions,
  })

  const form = useAppForm({
    defaultValues: { name: '', email: '', password: '', departmentId: '' } as RegisterFormInput,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: RegisterRequestSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Register form invalid', formApi.state.errors)
      }
    },
    onSubmit: async ({ value, formApi }) => {
      const request = RegisterRequestSchema.parse(value)
      const res = await safe(registerMutation.mutateAsync(request))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isError(res)) return toast.error(getErrorMessage(res), { position: 'top-center' })
      toast.success(`Welcome, ${res.user.name}`)
    },
  })

  const handleFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void form.handleSubmit()
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Enter your details to get started.</CardDescription>
      </CardHeader>

      <form onSubmit={handleFormSubmit} noValidate className="grid gap-4">
        <CardContent className="grid gap-4">
          <form.AppField name="name">
            {(f) => <f.TextField label="Name" autoComplete="name" autoFocus required />}
          </form.AppField>
          <form.AppField name="email">
            {(f) => (
              <f.TextField
                label="Email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(f) => (
              <f.TextField
                label="Password"
                type="password"
                autoComplete="new-password"
                description="At least 8 characters, with upper and lower case letters, a number and a symbol."
                required
              />
            )}
          </form.AppField>
          {departmentsPending ? (
            <DepartmentFieldSkeleton />
          ) : (
            <form.AppField name="departmentId">
              {(f) => (
                <f.SelectField
                  label="Department"
                  options={departmentOptions}
                  placeholder="Select your department"
                  required
                />
              )}
            </form.AppField>
          )}
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <form.AppForm>
            <form.SubscribeButton
              label="Create account"
              submittingLabel="Creating account..."
              className="w-full"
            />
          </form.AppForm>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-foreground underline underline-offset-4">
              Login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

function DepartmentFieldSkeleton() {
  return (
    <div role="status" aria-label="Loading departments" className="grid gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9" />
    </div>
  )
}
