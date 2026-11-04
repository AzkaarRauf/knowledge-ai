import { Document } from '@langchain/core/documents'
import { Test, TestingModule } from '@nestjs/testing'
import { INGESTION_BATCH_SIZE } from 'src/ai-quota/ai-quota.constants.js'
import { AiQuotaService } from 'src/ai-quota/ai-quota.service.js'
import { AiBusyException, AiDailyLimitException } from 'src/common/exceptions/rate-limit.exceptions.js'
import { EmbeddingService } from './embedding.service.js'

// fake google client so no real api call is made
const google = vi.hoisted(() => ({
    ctorArgs: vi.fn(),
    embedQuery: vi.fn(),
}))

vi.mock('@langchain/google-genai', () => ({
    GoogleGenerativeAIEmbeddings: class {
        constructor(args: unknown) {
            google.ctorArgs(args)
        }
        embedQuery = google.embedQuery
    },
}))

// skip real backoff waits
vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn(() => Promise.resolve()) }))

const rateLimited = () => Object.assign(new Error('429 Too Many Requests'), { status: 429, errorDetails: [{ retryDelay: '2s' }] })

describe('EmbeddingService', () => {
    let service: EmbeddingService
    const aiQuotaService = { reserveIngestionDay: vi.fn(), waitIngestionMinute: vi.fn(), cooldown: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            providers: [EmbeddingService, { provide: AiQuotaService, useValue: aiQuotaService }],
        }).compile()

        service = module.get<EmbeddingService>(EmbeddingService)
    })

    it('creates the google client with the 768 dim embedding model and no retries', () => {
        expect(google.ctorArgs).toHaveBeenCalledWith({ model: 'gemini-embedding-2', outputDimensionality: 768, maxRetries: 0 })
    })

    describe('embedDocuments', () => {
        const docs = (n: number) => Array.from({ length: n }, (_, i) => new Document({ pageContent: `text ${i}` }))

        it('reserves the whole doc for today, then embeds each text in quota sized batches', async () => {
            google.embedQuery.mockImplementation((text: string) => Promise.resolve([Number(text.split(' ')[1])]))
            const count = INGESTION_BATCH_SIZE + 1

            const embeds = await service.embedDocuments(docs(count))

            expect(aiQuotaService.reserveIngestionDay).toHaveBeenCalledWith(count)
            expect(aiQuotaService.waitIngestionMinute.mock.calls).toEqual([[INGESTION_BATCH_SIZE], [1]])
            expect(embeds).toEqual(Array.from({ length: count }, (_, i) => [i]))
        })

        it('embeds nothing when today has no budget left', async () => {
            aiQuotaService.reserveIngestionDay.mockRejectedValue(new AiDailyLimitException(new Date()))

            await expect(service.embedDocuments(docs(2))).rejects.toBeInstanceOf(AiDailyLimitException)
            expect(google.embedQuery).not.toHaveBeenCalled()
        })

        it('throws on a failed batch instead of returning empty embeddings', async () => {
            google.embedQuery.mockRejectedValue(new Error('boom'))

            await expect(service.embedDocuments(docs(2))).rejects.toThrow('boom')
        })

        it('backs off on a gemini 429 and retries the batch', async () => {
            google.embedQuery.mockRejectedValueOnce(rateLimited()).mockResolvedValue([0.1])

            await expect(service.embedDocuments(docs(1))).resolves.toEqual([[0.1]])
            expect(aiQuotaService.cooldown).toHaveBeenCalledWith('embedding', 2000)
            expect(aiQuotaService.waitIngestionMinute).toHaveBeenCalledTimes(2)
        })

        it('gives up after 3 tries on gemini 429', async () => {
            google.embedQuery.mockRejectedValue(rateLimited())

            await expect(service.embedDocuments(docs(1))).rejects.toThrow('429')
            expect(google.embedQuery).toHaveBeenCalledTimes(3)
        })
    })

    describe('embedQuery', () => {
        it('embeds the query text', async () => {
            google.embedQuery.mockResolvedValue([0.1, 0.2])

            await expect(service.embedQuery('what is x?')).resolves.toEqual([0.1, 0.2])
            expect(google.embedQuery).toHaveBeenCalledWith('what is x?')
        })

        it('turns a gemini 429 into AI_BUSY and pauses the embedding quota', async () => {
            google.embedQuery.mockRejectedValue(rateLimited())

            await expect(service.embedQuery('what is x?')).rejects.toBeInstanceOf(AiBusyException)
            expect(aiQuotaService.cooldown).toHaveBeenCalledWith('embedding', 2000)
        })
    })
})
