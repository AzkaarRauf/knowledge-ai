'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GOOGLE_LOGIN_URL } from '@/features/auth/auth.api'

// codes the backend puts in ?error= when google login fails
const LOGIN_ERRORS: Record<string, string> = {
  not_invited: 'Your account has not been invited. Ask an admin to add you.',
  google_failed: 'Google sign-in failed. Please try again.',
}

export function LoginForm() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Login</CardTitle>
        <CardDescription>Sign in with your work Google account.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        <Suspense fallback={null}>
          <LoginError />
        </Suspense>
        {/* full page load, not <Link>: the backend redirects to google */}
        <a href={GOOGLE_LOGIN_URL} className={buttonVariants({ className: 'w-full' })}>
          Continue with Google
        </a>
      </CardContent>
    </Card>
  )
}

/** Reads ?error= from the url, so it sits in <Suspense>. */
function LoginError() {
  const code = useSearchParams().get('error')
  if (!code) return null
  return (
    <p role="alert" className="text-sm text-destructive">
      {LOGIN_ERRORS[code] ?? LOGIN_ERRORS.google_failed}
    </p>
  )
}
