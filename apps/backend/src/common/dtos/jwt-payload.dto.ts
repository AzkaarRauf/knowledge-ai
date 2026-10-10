import { createZodDto } from 'nestjs-zod'
import z from 'zod'

export const jwtPayloadSchema = z.object({
    userId: z.uuid(),
    email: z.email(),
    departmentId: z.uuid(),
})

export class JwtPayloadDto extends createZodDto(jwtPayloadSchema) {}
