'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Building2, MessagesSquare, ShieldCheck } from 'lucide-react'
import { BrandMark } from '@/components/shell/Brand'
import { buttonVariants } from '@/components/ui/button'
import { GOOGLE_LOGIN_URL } from '@/features/auth/auth.api'

// codes the backend puts in ?error= when google login fails
const LOGIN_ERRORS: Record<string, string> = {
  not_invited: 'Your account has not been invited. Ask an admin to add you.',
  google_failed: 'Google sign-in failed. Please try again.',
}

const HIGHLIGHTS = [
  { icon: MessagesSquare, title: 'Answers with sources', text: 'Every reply cites the documents it came from.' },
  { icon: Building2, title: 'Scoped by department', text: 'People only search the knowledge they are allowed to see.' },
  { icon: ShieldCheck, title: 'Single sign-on', text: 'Invite-only access through your company Google account.' },
]

/** Split screen: product story on the left, sign-in on the right. */
export function LoginForm() {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-primary-foreground lg:flex">
        {/* soft glow behind the copy */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-40 size-[36rem] rounded-full bg-white/10 blur-3xl"
        />
        <div className="relative flex items-center gap-2.5">
          <BrandMark className="size-9 bg-white/15 shadow-none ring-1 ring-white/20" />
          <span className="font-semibold tracking-tight">Knowledge AI</span>
        </div>
        <div className="relative max-w-md space-y-8">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight text-balance">
            Your organization&apos;s knowledge, one question away.
          </h1>
          <ul className="space-y-5">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-primary-foreground/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-primary-foreground/60">© Knowledge AI. All rights reserved.</p>
      </section>

      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <BrandMark className="size-10 lg:hidden" />
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">Use your work Google account to continue.</p>
          </div>
          <div className="grid gap-4">
            <Suspense fallback={null}>
              <LoginError />
            </Suspense>
            {/* full page load, not <Link>: the backend redirects to google */}
            <a
              href={GOOGLE_LOGIN_URL}
              className={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-10 w-full bg-card shadow-xs' })}
            >
              <GoogleIcon />
              Continue with Google
            </a>
          </div>
          <p className="text-xs text-muted-foreground">
            Access is invite-only. If you can&apos;t sign in, ask your admin to add you.
          </p>
        </div>
      </section>
    </main>
  )
}

/** Google "G" logo in brand colors. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" data-icon="inline-start">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

/** Reads ?error= from the url, so it sits in <Suspense>. */
function LoginError() {
  const code = useSearchParams().get('error')
  if (!code) return null
  return (
    <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {LOGIN_ERRORS[code] ?? LOGIN_ERRORS.google_failed}
    </p>
  )
}
