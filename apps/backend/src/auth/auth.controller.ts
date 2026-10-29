import { Body, Controller, Cookies, Delete, Get, Post, Res, UnauthorizedException } from '@nestjs/common'
import { type Response } from 'express'
import { ZodResponse } from 'nestjs-zod'
import { SkipAuth } from 'src/decorators/skip-auth/skip-auth.decorator.js'
import { AuthService } from './auth.service.js'
import { LoginResponseDto } from './dtos/login-response.dto.js'
import { LoginRequestDto } from './dtos/login.dto.js'
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto.js'
import { RegisterResponseDto } from './dtos/register-response.dto.js'
import { RegisterUserDto } from './dtos/register-user.dto.js'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { JwtPayload } from 'src/decorators/jwt-payload/jwt-payload.decorator.js'

@SkipAuth()
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @SkipAuth(false)
    @Get('credentials')
    @ZodResponse({ type: JwtPayloadDto, status: 200 })
    credentials(@JwtPayload() payload: JwtPayloadDto) {
        return payload
    }

    @Post('register')
    @ZodResponse({ type: RegisterResponseDto, status: 200 })
    register(@Body() registerUserDto: RegisterUserDto, @Res({ passthrough: true }) res: Response) {
        return this.authService.register(registerUserDto, res)
    }

    @Post('login')
    @ZodResponse({ type: LoginResponseDto, status: 200 })
    login(@Body() loginDto: LoginRequestDto, @Res({ passthrough: true }) res: Response) {
        return this.authService.login(loginDto, res)
    }

    @Get('refresh-token')
    @ZodResponse({ type: RefreshTokenResponseDto, status: 200 })
    refreshToken(@Cookies() cookies: any, @Res({ passthrough: true }) res: Response) {
        const refreshToken = cookies.refreshToken
        if (!refreshToken) throw new UnauthorizedException()
        return this.authService.refreshToken(refreshToken, res)
    }

    @Delete('logout')
    logout(@Cookies() cookies: any, @Res({ passthrough: true }) res: Response) {
        const refreshToken = cookies.refreshToken
        return this.authService.logout(refreshToken, res)
    }
}
