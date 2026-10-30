import { GoogleDoneRedirect } from '@/features/auth/components/google-done-redirect'

/** Backend sends the browser here after google login sets the cookies. */
export default function GoogleDonePage() {
  return <GoogleDoneRedirect />
}
