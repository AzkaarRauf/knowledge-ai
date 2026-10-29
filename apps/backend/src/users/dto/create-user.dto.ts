import { createZodDto } from 'nestjs-zod'
import { createUserRequestSchema } from 'shared'

export class CreateUserDto extends createZodDto(createUserRequestSchema) {}
