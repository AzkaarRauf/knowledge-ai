import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Response } from 'express'
import { ACCESS_TOKEN_COOKIE_NAME, REFRESH_TOKEN_COOKIE_NAME, Role } from 'shared'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { DEFAULT_DEPARTMENT_NAME, REFRESH_TOKEN_DURATION } from './auth.constants.js'
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto.js'
import { GoogleUser } from './google/google.strategy.js'
import { NotInvitedException } from './google/not-invited.exception.js'

@Injectable()
export class AuthService {
    private readonly refreshTokenCookieName = REFRESH_TOKEN_COOKIE_NAME
    private readonly accessTokenCookieName = ACCESS_TOKEN_COOKIE_NAME
    constructor(
        private db: PrismaService,
        private jwtService: JwtService,
    ) {}

    async loginWithGoogle(googleUser: GoogleUser, res: Response) {
        if (!googleUser.emailVerified) throw new NotInvitedException()

        const existing = await this.db.user.findFirst({
            where: {
                OR: [{ googleId: googleUser.googleId }, { email: { equals: googleUser.email, mode: 'insensitive' } }],
            },
            include: { department: { select: { id: true, name: true } } },
        })
        // email already linked to a different google account
        if (existing?.googleId && existing.googleId !== googleUser.googleId) throw new NotInvitedException()

        if (!existing) {
            const user = await this.createGoogleUser(googleUser)
            await this.issueSession(user, res)
            return
        }

        // first google login: link this google account to the existing user
        if (existing.googleId === null) {
            await this.db.user.update({ where: { id: existing.id }, data: { googleId: googleUser.googleId } })
        }

        await this.issueSession(existing, res)
    }

    private async createGoogleUser(googleUser: GoogleUser) {
        const department = await this.db.department.upsert({
            where: { name: DEFAULT_DEPARTMENT_NAME },
            update: {},
            create: { name: DEFAULT_DEPARTMENT_NAME },
        })
        return this.db.user.create({
            data: {
                email: googleUser.email.toLowerCase(),
                name: googleUser.name || googleUser.email,
                googleId: googleUser.googleId,
                departmentId: department.id,
            },
            include: { department: { select: { id: true, name: true } } },
        })
    }

    private async issueSession(user: { email: string; id: string; role: Role; department: { id: string } }, res: Response) {
        const jwtPayload: JwtPayloadDto = {
            departmentId: user.department.id,
            email: user.email,
            userId: user.id,
            role: user.role,
        }

        const token = await this.generateAccessToken(jwtPayload)

        const newRefreshToken = await this.db.refreshToken.create({
            data: { userId: user.id, expiresAt: this.refreshTokenExpiry() },
        })

        this.setRefreshToken(res, newRefreshToken.token)
        this.setAccessToken(res, token)

        return { token, credentials: jwtPayload }
    }

    async refreshToken(refreshToken: string, res: Response) {
        const oldToken = await this.db.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        })
        if (!oldToken) {
            this.clearAllAuthTokens(res)
            throw new UnauthorizedException()
        }
        if (oldToken.expiresAt.getTime() <= Date.now()) {
            await this.db.refreshToken.delete({ where: { id: oldToken.id } })
            this.clearAllAuthTokens(res)
            throw new UnauthorizedException()
        }
        const [newToken] = await this.db.$transaction([
            this.db.refreshToken.create({ data: { userId: oldToken.userId, expiresAt: this.refreshTokenExpiry() } }),
            this.db.refreshToken.delete({ where: { id: oldToken.id } }),
        ])
        const accessToken = await this.generateAccessToken({
            departmentId: oldToken.user.departmentId,
            email: oldToken.user.email,
            userId: oldToken.userId,
            role: oldToken.user.role,
        })
        this.setRefreshToken(res, newToken.token)
        this.setAccessToken(res, accessToken)
        const response = { token: accessToken } satisfies RefreshTokenResponseDto
        return response
    }

    async logout(refreshToken: string | undefined, res: Response) {
        this.clearAllAuthTokens(res)
        if (!refreshToken) return
        await this.db.refreshToken.deleteMany({ where: { token: refreshToken } })
    }

    private generateAccessToken(payload: JwtPayloadDto) {
        return this.jwtService.signAsync(payload)
    }
    private refreshTokenExpiry() {
        return new Date(Date.now() + REFRESH_TOKEN_DURATION)
    }
    private setRefreshToken(res: Response, refreshToken: string) {
        res.cookie(this.refreshTokenCookieName, refreshToken, {
            secure: true,
            sameSite: true,
            httpOnly: true,
            maxAge: REFRESH_TOKEN_DURATION,
        })
    }
    private setAccessToken(res: Response, accessToken: string) {
        res.cookie(this.accessTokenCookieName, accessToken, {
            secure: true,
            sameSite: true,
            httpOnly: true,
            // cookie lives as long as the refresh token so the frontend server can still read the role
            // after the JWT expires; the JWT's own `exp` still limits API use to ACCESS_TOKEN_DURATION
            maxAge: REFRESH_TOKEN_DURATION,
        })
    }
    private clearRefreshToken(res: Response) {
        res.clearCookie(this.refreshTokenCookieName)
    }
    private clearAccessToken(res: Response) {
        res.clearCookie(this.accessTokenCookieName)
    }
    private clearAllAuthTokens(res: Response) {
        this.clearAccessToken(res)
        this.clearRefreshToken(res)
    }
}
