import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller.js'
import { type Response } from 'express'
import { AuthService } from './auth.service.js'

const response = {
    user: {
        id: '6f1c2b1e-8a0e-4c7a-9a43-2f2a3a1d9b10',
        name: 'Jane Doe',
        email: 'jane@example.com',
        department: { id: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33', name: 'Engineering' },
    },
    token: 'signed-token',
}

const res = {} as Response

describe('AuthController', () => {
    let controller: AuthController
    const authService = { register: vi.fn(), login: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [{ provide: AuthService, useValue: authService }],
        }).compile()

        controller = module.get<AuthController>(AuthController)
    })

    describe('register', () => {
        it('delegates to AuthService.register and returns its result', async () => {
            const registerUserDto = {
                name: 'Jane Doe',
                email: 'jane@example.com',
                password: 'Plain-password1!',
                departmentId: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33',
            }
            authService.register.mockResolvedValue(response)

            await expect(controller.register(registerUserDto, res)).resolves.toEqual(response)
            expect(authService.register).toHaveBeenCalledWith(registerUserDto, res)
        })

        it('propagates errors from AuthService.register', async () => {
            authService.register.mockRejectedValue(new Error('boom'))

            await expect(
                controller.register(
                    {
                        name: 'Jane Doe',
                        email: 'jane@example.com',
                        password: 'Plain-password1!',
                        departmentId: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33',
                    },
                    res,
                ),
            ).rejects.toThrow('boom')
        })
    })

    describe('login', () => {
        it('delegates to AuthService.login and returns its result', async () => {
            const loginDto = { email: 'jane@example.com', password: 'Plain-password1!' }
            authService.login.mockResolvedValue(response)

            await expect(controller.login(loginDto, res)).resolves.toEqual(response)
            expect(authService.login).toHaveBeenCalledWith(loginDto, res)
        })

        it('propagates errors from AuthService.login', async () => {
            authService.login.mockRejectedValue(new Error('Invalid email or password'))

            await expect(controller.login({ email: 'jane@example.com', password: 'wrong' }, res)).rejects.toThrow(
                'Invalid email or password',
            )
        })
    })
})
