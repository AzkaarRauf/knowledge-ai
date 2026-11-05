import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AUTHOR } from '@/features/about/author'
import { env } from '@/lib/env'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: env.NEXT_PUBLIC_SITE_URL ? new URL(env.NEXT_PUBLIC_SITE_URL) : undefined,
  robots: { index: false, follow: false },
  title: { default: 'Knowledge AI', template: '%s · Knowledge AI' },
  description: "Ask questions and get cited answers from your organization's documents.",
  authors: [{ name: AUTHOR.name, url: AUTHOR.site }],
  creator: AUTHOR.name,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
