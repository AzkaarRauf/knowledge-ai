import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { ConversationsService } from './conversations.service.js'

describe('ConversationsService', () => {
    let service: ConversationsService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ConversationsService, { provide: PrismaService, useValue: {} }],
        }).compile()

        service = module.get<ConversationsService>(ConversationsService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
