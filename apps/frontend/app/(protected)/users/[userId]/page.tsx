import { UserDetail } from '@/features/users/components/UserDetail'

export default async function UserPage(props: PageProps<'/users/[userId]'>) {
  const { userId } = await props.params
  return <UserDetail key={userId} userId={userId} />
}
