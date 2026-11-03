import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { S3Service } from 'src/s3/s3.service.js'
import { DocumentProcessingConsumer } from './document-processing.consumer.js'
import { DocumentProcessingJobs, JobOf } from './queue.constants.js'

const documentId = 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33'
const job = { name: 'process', data: { documentId, mimetype: 'text/plain' } } as JobOf<DocumentProcessingJobs>

describe('DocumentProcessingConsumer', () => {
    let consumer: DocumentProcessingConsumer
    const tx = { documentChunk: { deleteMany: vi.fn() }, $executeRaw: vi.fn() }
    const db = { document: { findUnique: vi.fn() }, $transaction: vi.fn() }
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
    })

    it('skips when the document was deleted before the job ran', async () => {
        db.document.findUnique.mockResolvedValue(null)

        await consumer.process(job)

        expect(s3Service.download).not.toHaveBeenCalled()
        expect(db.$transaction).not.toHaveBeenCalled()
    })
})
