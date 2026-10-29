'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

type NavItem = { href: string; label: string }

/** Renders already-filtered nav items. `highlightActive` reads the pathname to mark the current link. */
export function NavLinks({ items, highlightActive }: { items: readonly NavItem[]; highlightActive?: boolean }) {
  return highlightActive ? <ActiveNavLinks items={items} /> : <NavLinksList items={items} pathname={null} />
}

function ActiveNavLinks({ items }: { items: readonly NavItem[] }) {
  return <NavLinksList items={items} pathname={usePathname()} />
}

function NavLinksList({ items, pathname }: { items: readonly NavItem[]; pathname: string | null }) {
  // root only matches itself; other items also match their nested routes
  const isActive = (href: string) =>
    pathname !== null && (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))

  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-1">
        {items.map((item) => (
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
