import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AboutDialog } from '@/features/about/components/AboutDialog'
import { getCredentials } from '@/features/auth/auth.server'
import { LogoutButton } from '@/features/auth/components/logout-button'

/** Signed-in user at the bottom of the sidebar. Reads the cookie, so it sits in <Suspense>. */
export async function UserCard() {
  const credentials = await getCredentials()
  const email = credentials?.email || 'Signed in'
  const isAdmin = credentials?.role === 'ADMIN'

  return (
    <div className="flex items-center gap-2.5 rounded-lg p-1.5">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground uppercase"
      >
        {email.slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={email}>
          {email}
        </p>
        <Badge variant={isAdmin ? 'default' : 'secondary'} className="mt-0.5 h-4 px-1 text-[10px]">
          {isAdmin ? 'Admin' : 'Member'}
        </Badge>
      </div>
      <AboutDialog />
      <LogoutButton />
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div role="status" aria-label="Loading account" className="flex items-center gap-2.5 p-1.5">
      <Skeleton className="size-8 rounded-full" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  )
}
