import { z } from 'zod'

export const HealthSchema = z.object({
  status: z.string().catch(''),
})
export type Health = z.infer<typeof HealthSchema>
