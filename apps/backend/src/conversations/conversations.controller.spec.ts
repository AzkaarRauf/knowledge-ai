import { Test, TestingModule } from '@nestjs/testing'
import { ConversationsController } from './conversations.controller.js'
import { ConversationsService } from './conversations.service.js'

describe('ConversationsController', () => {
    let controller: ConversationsController

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ConversationsController],
            providers: [{ provide: ConversationsService, useValue: {} }],
        }).compile()

        controller = module.get<ConversationsController>(ConversationsController)
    })

    it('should be defined', () => {
        expect(controller).toBeDefined()
    })
})
