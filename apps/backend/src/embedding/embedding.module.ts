import { Module } from '@nestjs/common'
import { AiQuotaModule } from 'src/ai-quota/ai-quota.module.js'
import { EmbeddingService } from './embedding.service.js'

@Module({
    imports: [AiQuotaModule],
    providers: [EmbeddingService],
    exports: [EmbeddingService],
})
export class EmbeddingModule {}
