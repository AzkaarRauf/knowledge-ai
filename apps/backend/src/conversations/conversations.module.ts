import { Module } from '@nestjs/common'
import { LLMModule } from 'src/llm/llm.module.js'
import { RAGModule } from 'src/rag/rag.module.js'
import { ConversationsController } from './conversations.controller.js'
import { ConversationsService } from './conversations.service.js'

@Module({
    controllers: [ConversationsController],
    providers: [ConversationsService],
    imports: [RAGModule, LLMModule],
})
export class ConversationsModule {}
