import { createZodDto } from 'nestjs-zod'
import { loginRequestSchema } from 'shared'

export class LoginRequestDto extends createZodDto(loginRequestSchema) {}
