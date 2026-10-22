'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import { LogoutButton } from '@/features/auth/components/logout-button'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

// add new modules here to show them in the nav bar
const NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/chat', label: 'Chat' },
  { href: '/documents', label: 'Documents' },
  { href: '/departments', label: 'Departments' },
] as const

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            Knowledge AI
          </Link>
          {/* usePathname on a dynamic route needs a Suspense boundary; fallback is the nav with nothing active */}
          <Suspense fallback={<NavLinks pathname={null} />}>
            <ActiveNavLinks />
          </Suspense>
        </div>
        <LogoutButton />
      </div>
    </header>
  )
}

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />
}

function NavLinks({ pathname }: { pathname: string | null }) {
  // root only matches itself; other items also match their nested routes
  const isActive = (href: string) =>
    pathname !== null && (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-1">
        {NAV_ITEMS.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink
              active={isActive(item.href)}
              className={navigationMenuTriggerStyle()}
              render={<Link href={item.href} />}
            >
              {item.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
