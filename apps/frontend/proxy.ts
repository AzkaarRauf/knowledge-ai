import { type NextRequest, NextResponse } from 'next/server'
import { REFRESH_TOKEN_COOKIE_NAME } from 'shared'

// Kept local: importing `@/lib/auth` would pull axios into the proxy bundle.
const LOGIN_ROUTE = '/auth/login'

export function proxy(request: NextRequest) {
  if (request.cookies.has(REFRESH_TOKEN_COOKIE_NAME)) return NextResponse.next()
  return NextResponse.redirect(new URL(LOGIN_ROUTE, request.url))
}

export const config = {
  // Skip auth pages, backend rewrites, Next internals and files with an extension (public assets).
  matcher: ['/((?!auth/|api/|health$|_next/static|_next/image|.*\\.\\w+$).*)'],
}
