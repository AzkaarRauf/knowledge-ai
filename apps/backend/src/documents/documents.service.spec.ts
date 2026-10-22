import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { S3Service } from 'src/s3/s3.service.js'
import { DocumentsService } from './documents.service.js'

const userId = '6f1c2b1e-8a0e-4c7a-9a43-2f2a3a1d9b10'
const document = { id: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33', filename: 'notes.txt' }

const txtFile = (text: string) =>
    ({ buffer: Buffer.from(text), mimetype: 'text/plain', originalname: 'notes.txt' }) as Express.Multer.File

describe('DocumentsService', () => {
    let service: DocumentsService
    const tx = { document: { create: vi.fn() }, $executeRaw: vi.fn() }
    const db = {
        document: { findFirst: vi.fn() },
        $transaction: vi.fn(),
    }
    const s3Service = { generateKey: vi.fn(), upload: vi.fn(), delete: vi.fn() }
    const embeddingService = { embedDocuments: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()
        // run the interactive transaction callback with the fake tx client
        db.$transaction.mockImplementation((fn: (t: typeof tx) => unknown) => fn(tx))

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentsService,
                { provide: PrismaService, useValue: db },
                { provide: S3Service, useValue: s3Service },
                { provide: EmbeddingService, useValue: embeddingService },
            ],
        }).compile()

        service = module.get<DocumentsService>(DocumentsService)
    })

    describe('upload', () => {
        it('returns the existing document without embedding when the file was uploaded before', async () => {
            db.document.findFirst.mockResolvedValue(document)

            await expect(service.upload({ file: txtFile('hello'), userId, departmentId: null })).resolves.toEqual({
                document,
                isNew: false,
            })
            expect(embeddingService.embedDocuments).not.toHaveBeenCalled()
            expect(s3Service.upload).not.toHaveBeenCalled()
        })

        it('embeds the chunks, uploads to s3 and saves the document', async () => {
            db.document.findFirst.mockResolvedValue(null)
            embeddingService.embedDocuments.mockResolvedValue([[0.1, 0.2]])
            s3Service.generateKey.mockReturnValue('admin/notes.txt')
            tx.document.create.mockResolvedValue(document)

            await expect(service.upload({ file: txtFile('hello world'), userId, departmentId: null })).resolves.toEqual({
                document,
                isNew: true,
            })

            const [chunks] = embeddingService.embedDocuments.mock.calls[0]
            expect(chunks.map((c: { pageContent: string }) => c.pageContent)).toEqual(['hello world'])
            expect(s3Service.upload).toHaveBeenCalledWith(expect.objectContaining({ key: 'admin/notes.txt' }))
            expect(tx.$executeRaw).toHaveBeenCalled()
        })

        it('deletes the s3 object when saving to db fails', async () => {
            db.document.findFirst.mockResolvedValue(null)
            embeddingService.embedDocuments.mockResolvedValue([[0.1, 0.2]])
            s3Service.generateKey.mockReturnValue('admin/notes.txt')
            s3Service.delete.mockResolvedValue(undefined)
            tx.document.create.mockRejectedValue(new Error('db down'))

            await expect(service.upload({ file: txtFile('hello world'), userId, departmentId: null })).rejects.toThrow('db down')
            expect(s3Service.delete).toHaveBeenCalledWith('admin/notes.txt')
        })
    })
})
