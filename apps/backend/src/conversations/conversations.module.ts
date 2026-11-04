import { Module } from '@nestjs/common'
import { AiQuotaModule } from 'src/ai-quota/ai-quota.module.js'
import { LLMModule } from 'src/llm/llm.module.js'
import { RAGModule } from 'src/rag/rag.module.js'
import { ConversationsController } from './conversations.controller.js'
import { ConversationsService } from './conversations.service.js'

@Module({
    controllers: [ConversationsController],
    providers: [ConversationsService],
    imports: [RAGModule, LLMModule, AiQuotaModule],
})
export class ConversationsModule {}
