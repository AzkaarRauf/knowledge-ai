import { createZodDto } from 'nestjs-zod'
import { loginResponseSchema } from './login-response.dto.js'

export const registerResponseSchema = loginResponseSchema

export class RegisterResponseDto extends createZodDto(registerResponseSchema) {}
