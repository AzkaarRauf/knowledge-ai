import { createZodDto } from 'nestjs-zod'
import { Role } from 'src/generated/prisma/enums.js'
import z from 'zod'

export const jwtPayloadSchema = z.object({
    userId: z.uuid(),
    email: z.email(),
    departmentId: z.uuid(),
    role: z.enum(Role),
})

export class JwtPayloadDto extends createZodDto(jwtPayloadSchema) {}
