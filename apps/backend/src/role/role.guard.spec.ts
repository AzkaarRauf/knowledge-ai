import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { RoleGuard } from './role.guard.js'

describe('RoleGuard', () => {
    let guard: RoleGuard

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [RoleGuard, Reflector],
        }).compile()

        guard = module.get<RoleGuard>(RoleGuard)
    })

    it('should be defined', () => {
        expect(guard).toBeDefined()
    })
})
