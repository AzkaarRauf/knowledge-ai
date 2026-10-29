import { AdminGate } from '@/features/auth/components/admin-gate'

export default function UsersLayout({ children }: LayoutProps<'/users'>) {
  return <AdminGate>{children}</AdminGate>
}
