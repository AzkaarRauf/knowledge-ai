import type { Metadata } from 'next'
import { PrivacyPolicy } from '@/features/legal/components/PrivacyPolicy'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return <PrivacyPolicy />
}
