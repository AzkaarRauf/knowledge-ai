import { Module } from '@nestjs/common'
import { LLMService } from './llm.service.js'

@Module({
    providers: [LLMService],
    exports: [LLMService],
})
export class LLMModule {}
