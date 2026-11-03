import { Suspense } from 'react'
import { Brand } from '@/components/shell/Brand'
import { MobileNav } from '@/components/shell/MobileNav'
import { SidebarNav } from '@/components/shell/SidebarNav'
import { UserCard, UserCardSkeleton } from '@/components/shell/UserCard'
import { getCredentials } from '@/features/auth/auth.server'
import { HealthStatus } from '@/features/health/components/HealthStatus'

/** Fixed left sidebar on desktop. */
export function AppSidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center px-4">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-4">
        {/* reading the cookie is request-time, so it streams in behind Suspense; fallback shows links every role has */}
        <Suspense fallback={<SidebarNav isAdmin={false} />}>
          <RoleSidebarNav />
        </Suspense>
      </div>
      <div className="space-y-1 border-t p-2">
        <HealthStatus className="px-1.5 py-1" />
        <Suspense fallback={<UserCardSkeleton />}>
          <UserCard />
        </Suspense>
      </div>
    </aside>
  )
}

/** Top bar on small screens, where the sidebar is hidden. */
export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b bg-sidebar px-4 md:hidden">
      <Brand />
      <Suspense fallback={<MobileNav isAdmin={false} />}>
        <RoleMobileNav />
      </Suspense>
    </header>
  )
}

async function RoleSidebarNav() {
  const isAdmin = (await getCredentials())?.role === 'ADMIN'
  return (
    // usePathname on a dynamic route needs a Suspense boundary; fallback is the nav with nothing active
    <Suspense fallback={<SidebarNav isAdmin={isAdmin} />}>
      <SidebarNav isAdmin={isAdmin} highlightActive />
    </Suspense>
  )
}

async function RoleMobileNav() {
  const isAdmin = (await getCredentials())?.role === 'ADMIN'
  return <MobileNav isAdmin={isAdmin} />
}
