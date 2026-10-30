import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'

describe('AuthController', () => {
    let controller: AuthController
    const authService = { loginWithGoogle: vi.fn(), refreshToken: vi.fn(), logout: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: authService }],
        }).compile()

        controller = module.get<AuthController>(AuthController)
    })

    it('is defined', () => {
        expect(controller).toBeDefined()
    })
})
