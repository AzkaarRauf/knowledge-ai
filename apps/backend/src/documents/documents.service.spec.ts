import { getQueueToken } from '@nestjs/bullmq'
import { Test, TestingModule } from '@nestjs/testing'
import { Prisma } from 'src/generated/prisma/client.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { QueueNames } from 'src/queue/queue.constants.js'
import { S3Service } from 'src/s3/s3.service.js'
import { DocumentsService } from './documents.service.js'

const userId = '6f1c2b1e-8a0e-4c7a-9a43-2f2a3a1d9b10'
const document = { id: 'b5f0b6c2-4d2b-4a0e-8f43-7c1d1f0a2e33', filename: 'notes.txt' }

const txtFile = (text: string) =>
    ({ buffer: Buffer.from(text), mimetype: 'text/plain', originalname: 'notes.txt' }) as Express.Multer.File

describe('DocumentsService', () => {
    let service: DocumentsService
    const db = {
        document: {
            findFirst: vi.fn(),
            create: vi.fn(),
            delete: vi.fn(),
            update: vi.fn(),
        },
    }
    const s3Service = { generateKey: vi.fn(), upload: vi.fn(), delete: vi.fn() }
    const queue = { add: vi.fn() }

    beforeEach(async () => {
        vi.resetAllMocks()
        s3Service.generateKey.mockReturnValue('admin/notes.txt')
        s3Service.delete.mockResolvedValue(undefined)

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                DocumentsService,
                { provide: PrismaService, useValue: db },
                { provide: S3Service, useValue: s3Service },
                { provide: getQueueToken(QueueNames.documentProcessing), useValue: queue },
            ],
        }).compile()

        service = module.get<DocumentsService>(DocumentsService)
    })

    describe('upload', () => {
        it('returns the existing document without uploading when the file was uploaded before', async () => {
            db.document.findFirst.mockResolvedValue(document)

            await expect(service.upload({ file: txtFile('hello'), userId, departmentId: null })).resolves.toEqual({
                document,
                isNew: false,
            })
            expect(s3Service.upload).not.toHaveBeenCalled()
            expect(queue.add).not.toHaveBeenCalled()
        })

        it('returns a failed document as is when the same file is uploaded again', async () => {
            const failed = { ...document, status: 'FAILED' }
            db.document.findFirst.mockResolvedValue(failed)

            await expect(service.upload({ file: txtFile('hello'), userId, departmentId: null })).resolves.toEqual({
                document: failed,
                isNew: false,
            })
            expect(db.document.update).not.toHaveBeenCalled()
            expect(queue.add).not.toHaveBeenCalled()
        })

        it('looks up the existing document by the unique key, not the uploader', async () => {
            db.document.findFirst.mockResolvedValue(document)

            await service.upload({ file: txtFile('hello'), userId, departmentId: null })
            const { where } = db.document.findFirst.mock.calls[0][0]
            expect(where).toEqual(expect.objectContaining({ fileHash: expect.any(String), departmentId: null }))
            expect(where).not.toHaveProperty('userId')
        })

        it('rejects binary content sent as text/plain', async () => {
            db.document.findFirst.mockResolvedValue(null)

            await expect(service.upload({ file: txtFile('a\0b'), userId, departmentId: null })).rejects.toThrow(
                'File is not valid plain text',
            )
            expect(s3Service.upload).not.toHaveBeenCalled()
        })

        it('uploads to s3, saves the document and queues processing', async () => {
            db.document.findFirst.mockResolvedValue(null)
            db.document.create.mockResolvedValue(document)
            queue.add.mockResolvedValue({})

            await expect(service.upload({ file: txtFile('hello world'), userId, departmentId: null })).resolves.toEqual({
                document,
                isNew: true,
            })

            expect(s3Service.upload).toHaveBeenCalledWith(expect.objectContaining({ key: 'admin/notes.txt' }))
            expect(queue.add).toHaveBeenCalledWith(
                'process',
                { documentId: document.id, mimetype: 'text/plain' },
                { jobId: document.id },
            )
        })

        it('deletes the s3 object when saving to db fails', async () => {
            db.document.findFirst.mockResolvedValue(null)
            db.document.create.mockRejectedValue(new Error('db down'))

            await expect(service.upload({ file: txtFile('hello world'), userId, departmentId: null })).rejects.toThrow('db down')
            expect(s3Service.delete).toHaveBeenCalledWith('admin/notes.txt')
            expect(queue.add).not.toHaveBeenCalled()
        })

        it('returns the document saved by a parallel upload when create hits the unique index', async () => {
            db.document.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(document)
            db.document.create.mockRejectedValue(
                new Prisma.PrismaClientKnownRequestError('unique', { code: 'P2002', clientVersion: 'test' }),
            )

            await expect(service.upload({ file: txtFile('hello world'), userId, departmentId: null })).resolves.toEqual({
                document,
                isNew: false,
            })
            expect(s3Service.delete).toHaveBeenCalledWith('admin/notes.txt')
            expect(queue.add).not.toHaveBeenCalled()
        })

        it('deletes the document and s3 object when queueing fails', async () => {
            db.document.findFirst.mockResolvedValue(null)
            db.document.create.mockResolvedValue(document)
            db.document.delete.mockResolvedValue(document)
            queue.add.mockRejectedValue(new Error('redis down'))

            await expect(service.upload({ file: txtFile('hello world'), userId, departmentId: null })).rejects.toThrow(
                'redis down',
            )
            expect(db.document.delete).toHaveBeenCalledWith({ where: { id: document.id } })
            expect(s3Service.delete).toHaveBeenCalledWith('admin/notes.txt')
        })
    })

    describe('remove', () => {
        it('deletes only the document row; chunks go by cascade', async () => {
            db.document.delete.mockResolvedValue({ ...document, s3key: 'admin/notes.txt' })

            await service.remove(document.id, userId)
            expect(db.document.delete).toHaveBeenCalledWith({ where: { id: document.id, userId } })
            expect(s3Service.delete).toHaveBeenCalledWith('admin/notes.txt')
        })
    })
})
