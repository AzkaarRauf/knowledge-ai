import { createZodDto } from 'nestjs-zod'
import { loginResponseSchema } from 'shared'

export class LoginResponseDto extends createZodDto(loginResponseSchema) {}
