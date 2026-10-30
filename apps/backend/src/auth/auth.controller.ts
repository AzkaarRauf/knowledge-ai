import { Controller, Cookies, Delete, Get, Req, Res, UnauthorizedException, UseFilters, UseGuards } from '@nestjs/common'
import { type Request, type Response } from 'express'
import { ZodResponse } from 'nestjs-zod'
import { SkipAuth } from 'src/decorators/skip-auth/skip-auth.decorator.js'
import { AuthService } from './auth.service.js'
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto.js'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { JwtPayload } from 'src/decorators/jwt-payload/jwt-payload.decorator.js'
import { GoogleOAuthGuard } from './google/google-oauth.guard.js'
import { GoogleOAuthErrorFilter } from './google/google-oauth.filter.js'
import { GoogleUser } from './google/google.strategy.js'

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

    @Get('google')
    @UseGuards(GoogleOAuthGuard)
    googleLogin() {} // guard redirects to google

    @Get('google/callback')
    @UseGuards(GoogleOAuthGuard)
    @UseFilters(GoogleOAuthErrorFilter)
    async googleCallback(@Req() req: Request, @Res() res: Response) {
        await this.authService.loginWithGoogle(req.user as GoogleUser, res)
        res.redirect('http://localhost:3000/auth/google/done')
    }
}
