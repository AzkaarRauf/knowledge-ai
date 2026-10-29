import { createZodDto } from 'nestjs-zod'
import { jwtPayloadSchema } from 'shared'
import { Role } from 'src/generated/prisma/enums.js'
import z from 'zod'

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
// Will error `Type 'true' does not satisfy the expected type 'false'.` if Prisma Role enum and zod enums have drifted
true satisfies Equals<z.infer<typeof jwtPayloadSchema>['role'], Role>

export class JwtPayloadDto extends createZodDto(jwtPayloadSchema) {}
