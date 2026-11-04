import { Module } from '@nestjs/common'
import { AiQuotaModule } from 'src/ai-quota/ai-quota.module.js'
import { LLMService } from './llm.service.js'

@Module({
    imports: [AiQuotaModule],
    providers: [LLMService],
    exports: [LLMService],
})
export class LLMModule {}
