import { AdminOnly } from '@/features/auth/components/admin-only'

export default function DepartmentsLayout({ children }: LayoutProps<'/departments'>) {
  return <AdminOnly>{children}</AdminOnly>
}
