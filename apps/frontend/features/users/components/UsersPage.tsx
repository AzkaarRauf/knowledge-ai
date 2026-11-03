import { PageContainer, PageHeader } from '@/components/PageHeader'
import { CreateUserDialog } from '@/features/users/components/CreateUserDialog'
import { UserList } from '@/features/users/components/UserList'

export function UsersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Invite people to the workspace and choose their department."
        actions={<CreateUserDialog />}
      />
      <UserList />
    </PageContainer>
  )
}
