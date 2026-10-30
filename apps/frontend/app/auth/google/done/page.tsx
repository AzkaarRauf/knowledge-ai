import { redirect } from 'next/navigation'
import { HOME_ROUTE } from '@/lib/auth'

/**
 * Backend sends the browser here after google login sets the cookies. The proxy already
 * redirects logged-in users home; this is a fallback.
 */
export default function GoogleDonePage() {
  redirect(HOME_ROUTE)
}
