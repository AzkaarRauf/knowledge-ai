import { InjectQueue } from '@nestjs/bullmq'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { createHash } from 'node:crypto'
import { isError, type ListDocumentsQuery, type Paginated, safe } from 'shared'
import { buildPaginationMeta, toPrismaPagination } from 'src/common/utils/pagination.js'
import { Prisma } from 'src/generated/prisma/client.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { type DocumentProcessingQueue, QueueNames } from 'src/queue/queue.constants.js'
import { S3Service } from 'src/s3/s3.service.js'

// every document response carries its department
const documentInclude = { department: { select: { id: true, name: true } } } satisfies Prisma.DocumentInclude
type Document = Prisma.DocumentGetPayload<{ include: typeof documentInclude }>

@Injectable()
export class DocumentsService {
    private logger = new Logger(DocumentsService.name)

    constructor(
        private s3Service: S3Service,
        private db: PrismaService,
        @InjectQueue(QueueNames.documentProcessing) private documentProcessingQueue: DocumentProcessingQueue,
    ) {}

    async upload(args: { file: Express.Multer.File; userId: string; departmentId: string | null }): Promise<{
        document: Document
        isNew: boolean
    }> {
        const { file, userId, departmentId } = args
        const fileHash = createHash('sha256').update(file.buffer).digest('hex')
        const existingDocument = await this.findExisting({ fileHash, departmentId, userId })
        if (existingDocument) {
            return { document: existingDocument, isNew: false }
        }

        if (file.mimetype === 'text/plain') {
            this.assertPlainText(file.buffer)
        }

        // save document to object store
        const key = this.s3Service.generateKey({
            originalName: file.originalname,
            scope: 'admin',
        })
        await this.s3Service.upload({
            originalName: file.originalname,
            scope: 'admin',
            buffer: file.buffer,
            key,
        })

        const document = await safe(
            this.db.document.create({
                data: { fileHash, filename: file.originalname, s3key: key, userId, departmentId },
                include: documentInclude,
            }),
        )
        if (isError(document)) {
            void this.s3Service.delete(key).catch((e) => this.logger.error(e))
            // same file was saved by a parallel upload after our check. return that one instead
            if (document instanceof Prisma.PrismaClientKnownRequestError && document.code === 'P2002') {
                const raced = await this.findExisting({ fileHash, departmentId, userId })
                if (raced) {
                    return { document: raced, isNew: false }
                }
            }
            throw document
        }

        // chunking and embedding run in the worker. jobId = documentId so the same doc is never queued twice
        const job = await safe(
            this.documentProcessingQueue.add(
                'process',
                { documentId: document.id, mimetype: file.mimetype },
                { jobId: document.id },
            ),
        )
        if (isError(job)) {
            // roll back, else the hash check would return this chunkless doc forever
            await this.db.document.delete({ where: { id: document.id } }).catch((e) => this.logger.error(e))
            void this.s3Service.delete(key).catch((e) => this.logger.error(e))
            throw job
        }
        return { document, isNew: true }
    }

    // same key as the db unique index (fileHash, departmentId), limited to docs the user can see
    private findExisting(args: { fileHash: string; departmentId: string | null; userId: string }) {
        const { fileHash, departmentId, userId } = args
        return this.db.document.findFirst({
            where: { fileHash, departmentId, ...this.visibleTo(userId) },
            include: documentInclude,
        })
    }

    // txt has no magic number, so the validator trusts the client mimetype.
    // Check the bytes are real UTF-8 text with no NUL bytes (binary files have them).
    private assertPlainText(buffer: Buffer) {
        if (buffer.includes(0)) {
            throw new BadRequestException('File is not valid plain text')
        }
        try {
            new TextDecoder('utf-8', { fatal: true }).decode(buffer)
        } catch {
            throw new BadRequestException('File is not valid plain text')
        }
    }

    async findAll(userId: string, query: ListDocumentsQuery): Promise<Paginated<Document>> {
        const { search, sortBy, sortOrder, conversationId, createdFrom, createdTo } = query
        const where: Prisma.DocumentWhereInput = {
            ...this.visibleTo(userId),
            conversationId,
            ...(search && { filename: { contains: search, mode: 'insensitive' } }),
            ...((createdFrom || createdTo) && { createdAt: { gte: createdFrom, lte: createdTo } }),
        }

        const [data, total] = await this.db.$transaction([
            this.db.document.findMany({
                where,
                include: documentInclude,
                // id as tie-breaker so pages stay stable when sort values repeat
                orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
                ...toPrismaPagination(query),
            }),
            this.db.document.count({ where }),
        ])
        return { meta: buildPaginationMeta(query, total), data }
    }

    // throws P2025 (404) if document is missing or not visible to user
    findOne(id: string, userId: string): Promise<Document> {
        return this.db.document.findFirstOrThrow({ where: { id, ...this.visibleTo(userId) }, include: documentInclude })
    }

    async getDownloadUrl(id: string, userId: string): Promise<{ url: string }> {
        // throws P2025 (404) if document is missing or not visible to user
        const { s3key, filename } = await this.db.document.findFirstOrThrow({
            where: { id, ...this.visibleTo(userId) },
            select: { s3key: true, filename: true },
        })
        return { url: await this.s3Service.getReadUrl(s3key, filename) }
    }

    // shared docs are visible to everyone; docs tied to a conversation only to that conversation's owner
    private visibleTo(userId: string): Prisma.DocumentWhereInput {
        return { OR: [{ conversationId: null }, { conversation: { userId } }] }
    }

    async remove(id: string, userId: string) {
        const document = await this.db.document.delete({ where: { id, userId } })

        // db is source of truth, so a failed s3 delete only leaves an orphan file
        await this.s3Service.delete(document.s3key).catch((e) => this.logger.error(e))
    }
}
