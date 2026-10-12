import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service.js'
import { RegisterUserDto } from './dtos/register-user.dto.js'
import { LoginRequestDto } from './dtos/login.dto.js'
import { ZodResponse } from 'nestjs-zod'
import { LoginResponseDto } from './dtos/login-response.dto.js'
import { RegisterResponseDto } from './dtos/register-response.dto.js'

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ZodResponse({ type: RegisterResponseDto, status: 200 })
    register(@Body() registerUserDto: RegisterUserDto) {
        return this.authService.register(registerUserDto)
    }

    @Post('login')
    @ZodResponse({ type: LoginResponseDto, status: 200 })
    login(@Body() loginDto: LoginRequestDto) {
        return this.authService.login(loginDto)
    }
}
