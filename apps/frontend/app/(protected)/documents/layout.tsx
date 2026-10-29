import { AdminGate } from '@/features/auth/components/admin-gate'

export default function DocumentsLayout({ children }: LayoutProps<'/documents'>) {
  return <AdminGate>{children}</AdminGate>
}
