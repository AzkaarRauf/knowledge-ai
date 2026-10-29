import { createZodDto } from 'nestjs-zod'
import { updateUserRequestSchema } from 'shared'

export class UpdateUserDto extends createZodDto(updateUserRequestSchema) {}
