import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Response } from 'express'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { HashingService } from 'src/hashing/hashing.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { REFRESH_TOKEN_DURATION } from './auth.constants.js'
import { LoginResponseDto } from './dtos/login-response.dto.js'
import { LoginRequestDto } from './dtos/login.dto.js'
import { RefreshTokenResponseDto } from './dtos/refresh-token-response.dto.js'
import { RegisterResponseDto } from './dtos/register-response.dto.js'
import { RegisterUserDto } from './dtos/register-user.dto.js'

@Injectable()
export class AuthService {
    private readonly refreshTokenCookieName = 'refreshToken'
    constructor(
        private db: PrismaService,
        private hashingService: HashingService,
        private jwtService: JwtService,
    ) {}

    async register(registerUserDto: RegisterUserDto, res: Response): Promise<RegisterResponseDto> {
        const { password, ...dto } = registerUserDto
        const existingUser = await this.db.user.findUnique({ where: { email: dto.email } })
        if (existingUser) throw new ConflictException('Email is already registered')

        const hashedPassword = await this.hashingService.hash(password)
        const user = await this.db.user.create({
            data: { ...dto, password: hashedPassword },
            include: { department: true },
        })

        const token = await this.generateAccessToken({
            departmentId: user.department.id,
            email: user.email,
            userId: user.id,
        })

        const newRefreshToken = await this.db.refreshToken.create({ data: { userId: user.id } })

        this.setRefreshToken(res, newRefreshToken.token)

        const response: RegisterResponseDto = { user, token }

        return response
    }

    async login(loginDto: LoginRequestDto, res: Response): Promise<LoginResponseDto> {
        const user = await this.db.user.findFirst({
            where: { email: loginDto.email },
            include: { department: true },
        })
        const throwError = () => {
            throw new UnauthorizedException('Invalid email or password')
        }
        if (!user) return throwError()

        const passwordsMatch = await this.hashingService.compare({
            data: loginDto.password,
            encrypted: user.password,
        })
        if (!passwordsMatch) return throwError()

        const token = await this.generateAccessToken({
            departmentId: user.department.id,
            email: user.email,
            userId: user.id,
        })

        const newRefreshToken = await this.db.refreshToken.create({ data: { userId: user.id } })

        this.setRefreshToken(res, newRefreshToken.token)

        const response: LoginResponseDto = { user, token }

        return response
    }

    async refreshToken(refreshToken: string, res: Response) {
        const oldToken = await this.db.refreshToken.findFirst({
            where: { token: refreshToken },
            include: { user: true },
        })
        if (!oldToken) throw new UnauthorizedException()
        const expiresOn = oldToken.createdAt.getTime() + REFRESH_TOKEN_DURATION
        if (Date.now() > expiresOn) {
            await this.db.refreshToken.delete({ where: { id: oldToken.id } })
            throw new UnauthorizedException()
        }
        const [newToken] = await this.db.$transaction([
            this.db.refreshToken.create({ data: { userId: oldToken.userId } }),
            this.db.refreshToken.delete({ where: { id: oldToken.id } }),
        ])
        const accessToken = await this.generateAccessToken({
            departmentId: oldToken.user.departmentId,
            email: oldToken.user.email,
            userId: oldToken.userId,
        })
        this.setRefreshToken(res, newToken.token)
        const response = { token: accessToken } satisfies RefreshTokenResponseDto
        return response
    }

    async logout(refreshToken: string | undefined, res: Response) {
        this.clearRefreshToken(res)
        if (!refreshToken) return
        const token = await this.db.refreshToken.findFirst({ where: { token: refreshToken } })
        if (!token) return
        await this.db.refreshToken.delete({ where: { id: token.id } })
    }

    private generateAccessToken(payload: JwtPayloadDto) {
        return this.jwtService.signAsync(payload)
    }
    private setRefreshToken(res: Response, refreshToken: string) {
        res.cookie(this.refreshTokenCookieName, refreshToken, {
            secure: true,
            sameSite: true,
            httpOnly: true,
        })
    }
    private clearRefreshToken(res: Response) {
        res.clearCookie(this.refreshTokenCookieName)
    }
}
