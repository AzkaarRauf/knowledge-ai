import { AdminOnly } from '@/features/auth/components/admin-only'

export default function DocumentsLayout({ children }: LayoutProps<'/documents'>) {
  return <AdminOnly>{children}</AdminOnly>
}
