import { AppHeader } from '@/components/AppHeader'

export default function ProtectedLayout({ children }: LayoutProps<'/'>) {
  return (
    <>
      {/*<AuthGuard>
            <AppHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </AuthGuard>*/}
      <AppHeader />
      <div className="flex flex-1 flex-col">{children}</div>
    </>
  )
}
