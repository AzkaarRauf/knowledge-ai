import { CreateDepartmentDialog } from '@/features/departments/components/CreateDepartmentDialog'
import { DepartmentList } from '@/features/departments/components/DepartmentList'

export function DepartmentsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Departments</h1>
        <CreateDepartmentDialog />
      </div>
      <DepartmentList />
    </div>
  )
}
