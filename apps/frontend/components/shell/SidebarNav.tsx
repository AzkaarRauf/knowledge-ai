'use client'

import { Building2, FileText, LayoutDashboard, MessagesSquare, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

// add new modules here to show them in the nav; admin sections are hidden for other roles
const NAV_SECTIONS = [
  {
    label: 'Workspace',
    items: [
      { href: '/', label: 'Overview', icon: LayoutDashboard },
      { href: '/chat', label: 'Assistant', icon: MessagesSquare },
      { href: '/documents', label: 'Documents', icon: FileText },
    ],
  },
  {
    label: 'Administration',
    adminOnly: true,
    items: [
      { href: '/departments', label: 'Departments', icon: Building2 },
      { href: '/users', label: 'Users', icon: Users },
    ],
  },
] as const

type SidebarNavProps = {
  isAdmin: boolean
  /** reads the pathname to mark the current link */
  highlightActive?: boolean
  /** called when a link is clicked, e.g. to close the mobile menu */
  onNavigate?: () => void
}

export function SidebarNav({ highlightActive, ...props }: SidebarNavProps) {
  return highlightActive ? <ActiveSidebarNav {...props} /> : <SidebarNavList {...props} pathname={null} />
}

function ActiveSidebarNav(props: Omit<SidebarNavProps, 'highlightActive'>) {
  return <SidebarNavList {...props} pathname={usePathname()} />
}

function SidebarNavList({
  isAdmin,
  onNavigate,
  pathname,
}: Omit<SidebarNavProps, 'highlightActive'> & { pathname: string | null }) {
  // root only matches itself; other items also match their nested routes
  const isActive = (href: string) =>
    pathname !== null && (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))
  const sections = NAV_SECTIONS.filter((section) => !('adminOnly' in section) || isAdmin)

  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col gap-0.5">
          <h2 className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            {section.label}
          </h2>
          {section.items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  active && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )}
              >
                <Icon className={cn('size-4 shrink-0 text-muted-foreground', active && 'text-sidebar-primary')} />
                {label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
