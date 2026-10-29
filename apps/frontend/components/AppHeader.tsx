import Link from 'next/link'
import { Suspense } from 'react'
import { NavLinks } from '@/components/NavLinks'
import { LogoutButton } from '@/features/auth/components/logout-button'
import { getCredentials } from '@/features/auth/auth.server'

// add new modules here to show them in the nav bar; adminOnly items are hidden for other roles
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Chat' },
  { href: '/documents', label: 'Documents', adminOnly: true },
  { href: '/departments', label: 'Departments', adminOnly: true },
] as const

const PUBLIC_NAV_ITEMS = NAV_ITEMS.filter((item) => !('adminOnly' in item))

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Knowledge AI
          </Link>
          {/* reading the cookie is request-time, so it streams in behind Suspense; fallback shows links every role has */}
          <Suspense fallback={<NavLinks items={PUBLIC_NAV_ITEMS} />}>
            <RoleNavLinks />
          </Suspense>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}

async function RoleNavLinks() {
  const credentials = await getCredentials()
  const isAdmin = credentials?.role === 'ADMIN'
  const items = NAV_ITEMS.filter((item) => !('adminOnly' in item) || isAdmin)

  return (
    // usePathname on a dynamic route needs a Suspense boundary; fallback is the nav with nothing active
    <Suspense fallback={<NavLinks items={items} />}>
      <NavLinks items={items} highlightActive />
    </Suspense>
  )
}
