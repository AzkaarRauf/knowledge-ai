'use client'

import { revalidateLogic } from '@tanstack/react-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { z } from 'zod'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginRequestSchema } from '@/features/auth/auth.schema'
import { useLoginMutation } from '@/features/auth/hooks/login-mutation.hook'
import { useAppForm } from '@/hooks/useAppForm'
import { HOME_ROUTE } from '@/lib/auth'
import { ApiValidationError, getErrorMessage } from '@/lib/errors'
import { isError, safe } from 'shared'

type LoginFormInput = z.input<typeof LoginRequestSchema>

export function LoginForm() {
  const router = useRouter()
  const loginMutation = useLoginMutation()

  const form = useAppForm({
    defaultValues: { email: '', password: '' } as LoginFormInput,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: LoginRequestSchema },
    onSubmitInvalid: ({ formApi }) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Login form invalid', formApi.state.errors)
      }
    },
    onSubmit: async ({ value, formApi }) => {
      const request = LoginRequestSchema.parse(value)
      const res = await safe(loginMutation.mutateAsync(request))
      if (ApiValidationError.check(res)) return res.applyToForm(formApi)
      if (isError(res)) return toast.error(getErrorMessage(res), { position: 'top-center' })
      toast.success(`Welcome back, ${res.user.name}`)
      router.replace(HOME_ROUTE)
    },
  })

  const handleFormSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    void form.handleSubmit()
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Login</CardTitle>
        <CardDescription>Enter your email and password to access your account.</CardDescription>
      </CardHeader>

      <form onSubmit={handleFormSubmit} noValidate className="grid gap-4">
        <CardContent className="grid gap-4">
          <form.AppField name="email">
            {(f) => (
              <f.TextField
                label="Email"
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                autoFocus
                data-1p-ignore
                required
              />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(f) => <f.TextField label="Password" type="password" autoComplete="current-password" data-1p-ignore required />}
          </form.AppField>
        </CardContent>

        <CardFooter className="flex-col gap-3">
          <form.AppForm>
            <form.SubscribeButton label="Login" submittingLabel="Logging in..." className="w-full" />
          </form.AppForm>
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-foreground underline underline-offset-4">
              Create one
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
