import { createZodDto } from 'nestjs-zod'
import { refreshTokenResponseSchema } from 'shared'

export class RefreshTokenResponseDto extends createZodDto(refreshTokenResponseSchema) {}
