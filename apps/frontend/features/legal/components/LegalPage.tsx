import Link from 'next/link'
import type { ReactNode } from 'react'
import { BrandMark } from '@/components/shell/Brand'
import { LEGAL, PRIVACY_ROUTE, TERMS_ROUTE } from '@/features/legal/legal'

/** Shared shell for the privacy and terms pages: header, prose body, footer links. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="mb-10 inline-flex items-center gap-2.5">
          <BrandMark className="size-8" />
          <span className="font-semibold tracking-tight">{LEGAL.appName}</span>
        </Link>
        <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:tracking-tight">
          <h1>{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {LEGAL.lastUpdated}</p>
          {children}
        </article>
        <footer className="mt-12 flex gap-4 border-t pt-6 text-sm text-muted-foreground">
          <Link href={PRIVACY_ROUTE} className="hover:text-foreground hover:underline">
            Privacy Policy
          </Link>
          <Link href={TERMS_ROUTE} className="hover:text-foreground hover:underline">
            Terms of Service
          </Link>
        </footer>
      </div>
    </main>
  )
}

/** External link to the operator contact page. */
export function ContactLink() {
  return (
    <a href={LEGAL.contactUrl} target="_blank" rel="noopener">
      {LEGAL.contactLabel}
    </a>
  )
}
