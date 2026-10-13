import { AppHeader } from '@/components/AppHeader'
import { AuthGuard } from '@/features/auth/components/auth-guard'

export default function ProtectedLayout({ children }: LayoutProps<'/'>) {
  return (
    <AuthGuard>
      <AppHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </AuthGuard>
  )
}
