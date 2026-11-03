import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Logo mark + product name. */
export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <BrandMark />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight">Knowledge AI</span>
        <span className="text-[11px] text-muted-foreground">Enterprise workspace</span>
      </span>
    </Link>
  )
}

export function BrandMark({ className = 'size-8' }: { className?: string }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-1/2" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M6 4v16M6 12l7-8M6 12l7 8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="12" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    </span>
  )
}
