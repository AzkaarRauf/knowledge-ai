import type { Department } from '@/features/departments/schemas'

export const toDepartmentOptions = (departments: Department[]) =>
  departments.map((department) => ({ value: department.id, label: department.name }))
