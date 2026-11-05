import type { Metadata } from 'next'
import { TermsOfService } from '@/features/legal/components/TermsOfService'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return <TermsOfService />
}
