import { createZodDto } from 'nestjs-zod'
import { userSchema } from 'shared'

export class UserResponseDto extends createZodDto(userSchema, { codec: true }) {}
