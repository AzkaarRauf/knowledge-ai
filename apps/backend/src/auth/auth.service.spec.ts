import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { HashingService } from 'src/hashing/hashing.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { AuthService } from './auth.service.js'

const user = {
    id: '6f1c2b1e-8a0e-4c7a-9a43-2f2a3a1d9b10',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
    departmentId: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33',
    department: { id: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33', name: 'Engineering' },
}

describe('AuthService', () => {
    let service: AuthService
    const db = { user: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() } }
    const hashingService = { hash: vi.fn(), compare: vi.fn() }
    const jwtService = { signAsync: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()
        jwtService.signAsync.mockResolvedValue('signed-token')

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: db },
                { provide: HashingService, useValue: hashingService },
                { provide: JwtService, useValue: jwtService },
            ],
        }).compile()

        service = module.get<AuthService>(AuthService)
    })

    describe('register', () => {
        const registerUserDto = {
            name: user.name,
            email: user.email,
            password: 'Plain-password1!',
            departmentId: user.departmentId,
        }

        it('hashes the password, creates the user and returns a token', async () => {
            hashingService.hash.mockResolvedValue('hashed-password')
            db.user.create.mockResolvedValue(user)

            const result = await service.register({ ...registerUserDto })

            expect(hashingService.hash).toHaveBeenCalledWith('Plain-password1!')
            expect(db.user.create).toHaveBeenCalledWith({
                data: { ...registerUserDto, password: 'hashed-password' },
                include: { department: true },
            })
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                departmentId: user.department.id,
                email: user.email,
                userId: user.id,
            })
            expect(result).toEqual({ user, token: 'signed-token' })
        })

        it('propagates database errors without signing a token', async () => {
            hashingService.hash.mockResolvedValue('hashed-password')
            db.user.create.mockRejectedValue(new Error('Unique constraint failed'))

            await expect(service.register({ ...registerUserDto })).rejects.toThrow(
                'Unique constraint failed',
            )
            expect(jwtService.signAsync).not.toHaveBeenCalled()
        })

        it('throws ConflictException when the email is already registered', async () => {
            db.user.findUnique.mockResolvedValue(user)

            await expect(service.register({ ...registerUserDto })).rejects.toThrow(
                new ConflictException('Email is already registered'),
            )
            expect(db.user.findUnique).toHaveBeenCalledWith({ where: { email: user.email } })
            expect(db.user.create).not.toHaveBeenCalled()
        })
    })

    describe('login', () => {
        const loginDto = { email: user.email, password: 'Plain-password1!' }

        it('returns the user and a token when credentials are valid', async () => {
            db.user.findFirst.mockResolvedValue(user)
            hashingService.compare.mockResolvedValue(true)

            const result = await service.login(loginDto)

            expect(db.user.findFirst).toHaveBeenCalledWith({
                where: { email: user.email },
                include: { department: true },
            })
            expect(hashingService.compare).toHaveBeenCalledWith({
                data: 'Plain-password1!',
                encrypted: 'hashed-password',
            })
            expect(jwtService.signAsync).toHaveBeenCalledWith({
                departmentId: user.department.id,
                email: user.email,
                userId: user.id,
            })
            expect(result).toEqual({ user, token: 'signed-token' })
        })

        it('throws UnauthorizedException when the user does not exist', async () => {
            db.user.findFirst.mockResolvedValue(null)

            await expect(service.login(loginDto)).rejects.toThrow(
                new UnauthorizedException('Invalid email or password'),
            )
            expect(hashingService.compare).not.toHaveBeenCalled()
            expect(jwtService.signAsync).not.toHaveBeenCalled()
        })

        it('throws UnauthorizedException when the password is wrong', async () => {
            db.user.findFirst.mockResolvedValue(user)
            hashingService.compare.mockResolvedValue(false)

            await expect(service.login(loginDto)).rejects.toThrow(
                new UnauthorizedException('Invalid email or password'),
            )
            expect(jwtService.signAsync).not.toHaveBeenCalled()
        })
    })
})
