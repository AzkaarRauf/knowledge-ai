import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { RegisterUserDto } from './dtos/register-user.dto.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { HashingService } from 'src/hashing/hashing.service.js'
import { LoginRequestDto } from './dtos/login.dto.js'
import { LoginResponseDto } from './dtos/login-response.dto.js'
import { JwtService } from '@nestjs/jwt'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { RegisterResponseDto } from './dtos/register-response.dto.js'

@Injectable()
export class AuthService {
    constructor(
        private db: PrismaService,
        private hashingService: HashingService,
        private jwtService: JwtService,
    ) {}

    async register(registerUserDto: RegisterUserDto): Promise<RegisterResponseDto> {
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

        const response: RegisterResponseDto = { user, token }

        return response
    }

    async login(loginDto: LoginRequestDto): Promise<LoginResponseDto> {
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

        const response: LoginResponseDto = { user, token }

        return response
    }

    private generateAccessToken(payload: JwtPayloadDto) {
        return this.jwtService.signAsync(payload)
    }
}
