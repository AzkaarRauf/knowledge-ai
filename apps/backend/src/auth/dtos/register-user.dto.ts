import { createZodDto } from 'nestjs-zod'
import { registerRequestSchema } from 'shared'

export class RegisterUserDto extends createZodDto(registerRequestSchema) {}
