import { Test, TestingModule } from '@nestjs/testing'
import { HashingService } from 'src/hashing/hashing.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { UsersService } from './users.service.js'

describe('UsersService', () => {
    let service: UsersService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: PrismaService, useValue: {} },
                { provide: HashingService, useValue: {} },
            ],
        }).compile()

        service = module.get<UsersService>(UsersService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
