import { CreateUserDialog } from '@/features/users/components/CreateUserDialog'
import { UserList } from '@/features/users/components/UserList'

export function UsersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Users</h1>
        <CreateUserDialog />
      </div>
      <UserList />
    </div>
  )
}
