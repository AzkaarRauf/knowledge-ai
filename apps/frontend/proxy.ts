import { type NextRequest, NextResponse } from 'next/server'
import { REFRESH_TOKEN_COOKIE_NAME } from 'shared'
import { COLD_START_ROUTE } from '@/features/cold-start/routes'

// Kept local: importing `@/lib/auth` would pull axios into the proxy bundle.
const LOGIN_ROUTE = '/auth/login'
const AUTH_PREFIX = '/auth/'
const HOME_ROUTE = '/'

// Keep the default *.vercel.app domain out of search results (duplicate of the custom domain).
function withRobotsHeader(request: NextRequest, response: NextResponse) {
  if (request.nextUrl.hostname.endsWith('.vercel.app')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }
  return response
}

export function proxy(request: NextRequest) {
  return withRobotsHeader(request, handle(request))
}

function handle(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_TOKEN_COOKIE_NAME)
  const isAuthPage = request.nextUrl.pathname.startsWith(AUTH_PREFIX)

  // Reachable with or without a session, else a logged-out user on a cold start would loop via login.
  if (request.nextUrl.pathname.startsWith(COLD_START_ROUTE)) return NextResponse.next()

  // Logged-in users have no reason to see login. This also sends /auth/google/done home.
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
