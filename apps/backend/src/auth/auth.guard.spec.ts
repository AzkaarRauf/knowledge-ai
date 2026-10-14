import { Reflector } from '@nestjs/core'
import { JwtService } from '@nestjs/jwt'
import { Test, TestingModule } from '@nestjs/testing'
import { AuthGuard } from './auth.guard.js'

describe('AuthGuard', () => {
    let guard: AuthGuard

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [AuthGuard, Reflector, { provide: JwtService, useValue: { verifyAsync: vi.fn() } }],
        }).compile()

        guard = module.get<AuthGuard>(AuthGuard)
    })

    it('should be defined', () => {
        expect(guard).toBeDefined()
    })
})
