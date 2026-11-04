import { Document } from '@langchain/core/documents'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Injectable } from '@nestjs/common'
import { setTimeout as sleep } from 'node:timers/promises'
import { INGESTION_BACKOFF_MS, INGESTION_BATCH_SIZE, INGESTION_MAX_ATTEMPTS } from 'src/ai-quota/ai-quota.constants.js'
import { AiQuotaService } from 'src/ai-quota/ai-quota.service.js'
import { geminiRetryAfterMs } from 'src/ai-quota/gemini-error.js'
import { AiBusyException } from 'src/common/exceptions/rate-limit.exceptions.js'

@Injectable()
export class EmbeddingService {
    // quota for this model lives in AI_QUOTA.embedding (ai-quota.constants.ts)
    private readonly model = 'gemini-embedding-2'
    private readonly outputDimensionality = 768
    private readonly embeddings = new GoogleGenerativeAIEmbeddings({
        model: this.model,
        outputDimensionality: this.outputDimensionality,
        // no retries: each retry is one more call against the quota. ingestion retries itself below
        maxRetries: 0,
    })

    constructor(private aiQuotaService: AiQuotaService) {}

    /**
     * Embeds document chunks for ingestion, one batch at a time, inside the ingestion quota.
     * Throws AiDailyLimitException when the whole document does not fit today's budget.
     * Throws on any failed batch, so no chunk is ever saved without an embedding.
     */
    async embedDocuments(docs: Document[]) {
        const texts = docs.map((item) => item.pageContent)
        await this.aiQuotaService.reserveIngestionDay(texts.length)
        const embeds: number[][] = []
        for (let i = 0; i < texts.length; i += INGESTION_BATCH_SIZE) {
            embeds.push(...(await this.embedBatch(texts.slice(i, i + INGESTION_BATCH_SIZE))))
        }
        return embeds
    }

    /** embeds a chat query. the chat already reserved quota for it, see AiQuotaService.reserveChat */
    async embedQuery(query: string) {
        try {
            return await this.embeddings.embedQuery(query)
        } catch (e) {
            const retryAfterMs = geminiRetryAfterMs(e)
            if (retryAfterMs === null) throw e
            await this.aiQuotaService.cooldown('embedding', retryAfterMs)
            throw new AiBusyException(retryAfterMs / 1000)
        }
    }

    // one call per text, so each text is exactly one request against the quota.
    // on a gemini 429 waits with exponential backoff, up to INGESTION_MAX_ATTEMPTS tries
    private async embedBatch(texts: string[]) {
        for (let attempt = 1; ; attempt++) {
            await this.aiQuotaService.waitIngestionMinute(texts.length)
            try {
                return await Promise.all(texts.map((text) => this.embeddings.embedQuery(text)))
            } catch (e) {
                const retryAfterMs = geminiRetryAfterMs(e)
                if (retryAfterMs === null || attempt >= INGESTION_MAX_ATTEMPTS) throw e
                await this.aiQuotaService.cooldown('embedding', retryAfterMs)
                await sleep(Math.max(retryAfterMs, INGESTION_BACKOFF_MS * 2 ** (attempt - 1)))
            }
        }
    }
}
