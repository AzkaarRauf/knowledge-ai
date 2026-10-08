import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const uuidSchema = z.uuid('Must be a valid UUID')
