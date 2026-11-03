import { AppSidebar, MobileTopBar } from '@/components/shell/AppSidebar'

export default function ProtectedLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  )
}
