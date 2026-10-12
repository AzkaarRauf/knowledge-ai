import { createZodDto } from 'nestjs-zod'
import { registerResponseSchema } from 'shared'

export class RegisterResponseDto extends createZodDto(registerResponseSchema) {}
