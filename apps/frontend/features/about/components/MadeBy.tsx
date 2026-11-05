import { AUTHOR } from '@/features/about/author'
import { cn } from '@/lib/utils'

/** Small "Made by azkaar.dev" credit line. */
export function MadeBy({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground', className)}>
      Made by{' '}
      <a
        href={AUTHOR.site}
        target="_blank"
        rel="noopener"
        className="font-medium underline-offset-3 hover:text-foreground hover:underline"
      >
        {AUTHOR.siteLabel}
      </a>
    </p>
  )
}
