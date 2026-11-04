import { Test, TestingModule } from '@nestjs/testing'
import { DelayedError } from 'bullmq'
import { AI_QUOTA } from 'src/ai-quota/ai-quota.constants.js'
import { AiDailyLimitException } from 'src/common/exceptions/rate-limit.exceptions.js'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { CacheVersionService } from 'src/redis/cache-version.service.js'
import { S3Service } from 'src/s3/s3.service.js'
import { DocumentProcessingConsumer } from './document-processing.consumer.js'
import { DocumentProcessingJobs, JobOf } from './queue.constants.js'

const documentId = 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33'
const job = { name: 'process', data: { documentId, mimetype: 'text/plain' } } as JobOf<DocumentProcessingJobs>
// status writes outside the locked tx never overwrite DONE
const setStatusCall = (status: string) => ({ where: { id: documentId, status: { not: 'DONE' } }, data: { status } })

describe('DocumentProcessingConsumer', () => {
    let consumer: DocumentProcessingConsumer
    const tx = { documentChunk: { deleteMany: vi.fn() }, document: { updateMany: vi.fn() }, $executeRaw: vi.fn() }
    const db = { document: { findUnique: vi.fn(), updateMany: vi.fn() }, $transaction: vi.fn() }
    const cacheVersionService = { inc: vi.fn() }
    const s3Service = { download: vi.fn() }
    const embeddingService = { embedDocuments: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()
        // run the interactive transaction callback with the fake tx client
        db.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx))

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentProcessingConsumer,
                { provide: PrismaService, useValue: db },
                { provide: S3Service, useValue: s3Service },
                { provide: EmbeddingService, useValue: embeddingService },
                { provide: CacheVersionService, useValue: cacheVersionService },
            ],
        }).compile()

        consumer = module.get(DocumentProcessingConsumer)
    })

    it('chunks, embeds and replaces the document chunks', async () => {
        db.document.findUnique.mockResolvedValue({ s3key: 'admin/notes.txt', filename: 'notes.txt' })
        s3Service.download.mockResolvedValue(Buffer.from('hello world'))
        embeddingService.embedDocuments.mockResolvedValue([[0.1, 0.2]])

        await consumer.process(job)

        expect(s3Service.download).toHaveBeenCalledWith('admin/notes.txt')
        const [chunks] = embeddingService.embedDocuments.mock.calls[0]
        expect(chunks.map((c: { pageContent: string }) => c.pageContent)).toEqual(['hello world'])
        expect(tx.documentChunk.deleteMany).toHaveBeenCalledWith({ where: { documentId } })
        expect(tx.$executeRaw).toHaveBeenCalled()
        expect(db.document.updateMany).toHaveBeenCalledWith(setStatusCall('PROCESSING'))
        expect(tx.document.updateMany).toHaveBeenCalledWith({ where: { id: documentId }, data: { status: 'DONE' } })
        expect(cacheVersionService.inc).toHaveBeenCalledWith(['documents'])
        expect(db.$transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 10_000, timeout: 30_000 })
    })

    it('marks failed when the document has no text', async () => {
        db.document.findUnique.mockResolvedValue({ s3key: 'admin/empty.txt', filename: 'empty.txt' })
        s3Service.download.mockResolvedValue(Buffer.from(''))

        await consumer.process(job)

        expect(embeddingService.embedDocuments).not.toHaveBeenCalled()
        expect(db.document.updateMany).toHaveBeenLastCalledWith(setStatusCall('FAILED'))
    })

    it('marks failed on the first error, since there are no auto retries', async () => {
        db.document.findUnique.mockResolvedValue({ s3key: 'admin/notes.txt', filename: 'notes.txt' })
        s3Service.download.mockRejectedValue(new Error('s3 down'))

        await expect(consumer.process(job)).rejects.toThrow('s3 down')

        expect(db.document.updateMany).toHaveBeenLastCalledWith(setStatusCall('FAILED'))
    })

    it('skips when the document was deleted before the job ran', async () => {
        db.document.findUnique.mockResolvedValue(null)

        await consumer.process(job)

        expect(s3Service.download).not.toHaveBeenCalled()
        expect(db.$transaction).not.toHaveBeenCalled()
    })

    it('marks failed when the doc has more chunks than one day of ingestion quota', async () => {
        db.document.findUnique.mockResolvedValue({ s3key: 'admin/big.txt', filename: 'big.txt' })
        // ~800 new chars per chunk, so this gives well over 600 chunks
        s3Service.download.mockResolvedValue(Buffer.from('word '.repeat(AI_QUOTA.ingestion.perDay * 200)))

        await consumer.process(job)

        expect(embeddingService.embedDocuments).not.toHaveBeenCalled()
        expect(db.document.updateMany).toHaveBeenLastCalledWith(setStatusCall('FAILED'))
    })

    it('delays the job until reset, keeping the doc pending, when the daily quota is used up', async () => {
        const resetAt = new Date('2026-11-05T08:00:00.000Z')
        const moveToDelayed = vi.fn()
        const delayedJob = { ...job, moveToDelayed } as unknown as typeof job
        db.document.findUnique.mockResolvedValue({ s3key: 'admin/notes.txt', filename: 'notes.txt' })
        s3Service.download.mockResolvedValue(Buffer.from('hello world'))
        embeddingService.embedDocuments.mockRejectedValue(new AiDailyLimitException(resetAt))

        await expect(consumer.process(delayedJob, 'lock-token')).rejects.toBeInstanceOf(DelayedError)

        expect(moveToDelayed).toHaveBeenCalledWith(resetAt.getTime(), 'lock-token')
        expect(db.document.updateMany).toHaveBeenLastCalledWith(setStatusCall('PENDING'))
        expect(db.$transaction).not.toHaveBeenCalled()
    })
})
