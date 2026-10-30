import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { AuthService } from './auth.service.js'

describe('AuthService', () => {
    let service: AuthService
    const db = {
        user: { findFirst: vi.fn(), update: vi.fn() },
        refreshToken: { create: vi.fn() },
    }
    const jwtService = { signAsync: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()
        jwtService.signAsync.mockResolvedValue('signed-token')
        db.refreshToken.create.mockResolvedValue({ token: 'refresh-token' })

        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthService, { provide: PrismaService, useValue: db }, { provide: JwtService, useValue: jwtService }],
        }).compile()

        service = module.get<AuthService>(AuthService)
    })

    it('is defined', () => {
        expect(service).toBeDefined()
    })
})
