import { PageContainer, PageHeader } from '@/components/PageHeader'
import { CreateDepartmentDialog } from '@/features/departments/components/CreateDepartmentDialog'
import { DepartmentList } from '@/features/departments/components/DepartmentList'

export function DepartmentsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Departments"
        description="Group people and documents. Each chat searches one department."
        actions={<CreateDepartmentDialog />}
      />
      <DepartmentList />
    </PageContainer>
  )
}
