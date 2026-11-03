import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** buttons shown on the right */
  actions?: ReactNode
  /** small link above the title, back to the parent page */
  back?: { href: string; label: string }
  className?: string
}

/** Title row every page starts with. */
export function PageHeader({ title, description, actions, back, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        {back && (
          <Link
            href={back.href}
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
            {back.label}
          </Link>
        )}
        <h1 className="truncate text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

/** Width and padding shared by every non-chat page. */
export function PageContainer({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:p-8', className)} {...props} />
}

/** Heading strip inside a card, above a group of fields. */
export function SectionTitle({ title, description, className }: { title: string; description?: string; className?: string }) {
  return (
    <div className={cn('bg-muted/30 px-6 py-3', className)}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
