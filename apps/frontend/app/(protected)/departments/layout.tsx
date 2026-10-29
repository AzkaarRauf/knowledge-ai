import { AdminGate } from '@/features/auth/components/admin-gate'

export default function DepartmentsLayout({ children }: LayoutProps<'/departments'>) {
  return <AdminGate>{children}</AdminGate>
}
