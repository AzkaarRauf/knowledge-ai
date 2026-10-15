import { Module } from '@nestjs/common'
import { ConversationsService } from './conversations.service.js'
import { ConversationsController } from './conversations.controller.js'
import { EmbeddingModule } from 'src/embedding/embedding.module.js'
import { LLMModule } from 'src/llm/llm.module.js'

@Module({
    controllers: [ConversationsController],
    providers: [ConversationsService],
    imports: [EmbeddingModule, LLMModule],
})
export class ConversationsModule {}
