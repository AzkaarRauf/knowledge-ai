import { Module } from '@nestjs/common'
import { AiQuotaService } from './ai-quota.service.js'

@Module({
    providers: [AiQuotaService],
    exports: [AiQuotaService],
})
export class AiQuotaModule {}
