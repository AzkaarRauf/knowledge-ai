'use client'

import { BrandMark } from '@/components/shell/Brand'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AUTHOR, STACK } from '@/features/about/author'

/** Dialog about the app and who built it. Opened from the settings menu. */
export function AboutDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <BrandMark className="size-10" />
            <div className="space-y-1">
              <DialogTitle>Knowledge AI</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Designed and built by <span className="font-medium text-foreground">{AUTHOR.name}</span>
              </p>
            </div>
          </div>
          <DialogDescription className="pt-2">
            Ask questions and get cited answers from your organization&apos;s documents.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Built with</p>
          <div className="flex flex-wrap gap-1.5">
            {STACK.map((tech) => (
              <Badge key={tech} variant="secondary">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
        <DialogFooter>
          <a href={AUTHOR.github} target="_blank" rel="noopener" className={buttonVariants({ variant: 'outline' })}>
            GitHub
          </a>
          <a href={AUTHOR.site} target="_blank" rel="noopener" className={buttonVariants()}>
            {AUTHOR.siteLabel}
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
