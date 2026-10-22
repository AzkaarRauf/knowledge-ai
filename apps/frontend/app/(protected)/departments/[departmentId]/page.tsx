import { DepartmentDetail } from '@/features/departments/components/DepartmentDetail'

export default async function DepartmentPage(props: PageProps<'/departments/[departmentId]'>) {
  const { departmentId } = await props.params
  return <DepartmentDetail key={departmentId} departmentId={departmentId} />
}
