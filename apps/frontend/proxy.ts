import { type NextRequest, NextResponse } from 'next/server'
import { REFRESH_TOKEN_COOKIE_NAME } from 'shared'

// Kept local: importing `@/lib/auth` would pull axios into the proxy bundle.
const LOGIN_ROUTE = '/auth/login'
const AUTH_PREFIX = '/auth/'
const HOME_ROUTE = '/'

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE_NAME)
  const isAuthPage = request.nextUrl.pathname.startsWith(AUTH_PREFIX)

  // Logged-in users have no reason to see login/register.
  if (isAuthPage) {
    return hasSession ? NextResponse.redirect(new URL(HOME_ROUTE, request.url)) : NextResponse.next()
  }

  if (hasSession) return NextResponse.next()
  return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
}

export const config = {
  // Skip backend rewrites, Next internals and files with an extension (public assets).
  matcher: ['/((?!api/|health$|_next/static|_next/image|.*\\.\\w+$).*)'],
}
