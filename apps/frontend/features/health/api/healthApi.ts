import { api } from '@/lib/api-client'
import { HealthSchema } from '@/features/health/schemas'

export async function getHealth() {
  // /health is excluded from the backend's /api prefix and versioning, so it sits outside baseURL.
  const res = await api.get('/health', { baseURL: '/' })
  return HealthSchema.parse(res.data)
}
