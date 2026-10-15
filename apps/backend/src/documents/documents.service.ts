import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DocumentLoader } from '@langchain/core/document_loaders/base'
import { CharacterTextSplitter } from '@langchain/textsplitters'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'
import { isError, type ListDocumentsQuery, type Paginated, safe } from 'shared'
import { buildPaginationMeta, toPrismaPagination } from 'src/common/utils/pagination.js'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { Document, Prisma } from 'src/generated/prisma/client.js'
import { join, sql } from 'src/generated/prisma/internal/prismaNamespace.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { S3Service } from 'src/s3/s3.service.js'

@Injectable()
export class DocumentsService {
    private logger = new Logger(DocumentsService.name)

    constructor(
        private s3Service: S3Service,
        private db: PrismaService,
        private embeddingService: EmbeddingService,
    ) {}

    async upload({ file, userId }: { file: Express.Multer.File; userId: string }): Promise<{
        document: Document
        isNew: boolean
    }> {
        const fileHash = createHash('sha256').update(file.buffer).digest('hex')
        const existingDocument = await this.db.document.findFirst({ where: { fileHash, userId } })
        if (existingDocument) {
            return { document: existingDocument, isNew: false }
        }

        const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype })
        let loader: DocumentLoader
        switch (file.mimetype) {
            case 'text/plain':
                this.assertPlainText(file.buffer)
                loader = new TextLoader(blob)
                break
            case 'application/pdf':
                loader = new PDFLoader(blob)
                break
            default:
                loader = new DocxLoader(blob)
                break
        }
        const doc = await loader.load()

        // chunking
        const textSplitter = new CharacterTextSplitter({ chunkOverlap: 200, chunkSize: 1000 })
        const split = await textSplitter.splitDocuments(doc)

        // embedding
        const embeds = await this.embeddingService.embedDocuments(split)

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

        // save document and chunks in db
        const document = await safe(
            this.db.$transaction(async (tx) => {
                const document = await tx.document.create({
                    data: { fileHash, filename: file.originalname, s3key: key, userId },
                })
                const rows = split.map(
                    (item, i) =>
                        sql`(
                                ${randomUUID()}::uuid,
                                ${item.pageContent},
                                ${`[${embeds[i].join(',')}]`}::vector,
                                ${document.id}::uuid, ${JSON.stringify(item.metadata)}::jsonb,
                                now()
                              )`,
                )
                await tx.$executeRaw`
                      INSERT INTO "DocumentChunk" ("id", "content", "embedding", "documentId", "metadata", "updatedAt")
                      VALUES ${join(rows)}`

                return document
            }),
        )
        if (isError(document)) {
            void this.s3Service.delete(key).catch((e) => this.logger.error(e))
            throw document
        }
        return { document, isNew: true }
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
            userId,
            conversationId,
            ...(search && { filename: { contains: search, mode: 'insensitive' } }),
            ...((createdFrom || createdTo) && { createdAt: { gte: createdFrom, lte: createdTo } }),
        }

        const [data, total] = await this.db.$transaction([
            this.db.document.findMany({
                where,
                // id as tie-breaker so pages stay stable when sort values repeat
                orderBy: [{ [sortBy]: sortOrder }, { id: 'asc' }],
                ...toPrismaPagination(query),
            }),
            this.db.document.count({ where }),
        ])
        return { meta: buildPaginationMeta(query, total), data }
    }

    // throws P2025 (404) if document is missing or not owned by user
    findOne(id: string, userId: string): Promise<Document> {
        return this.db.document.findUniqueOrThrow({ where: { id, userId } })
    }

    async remove(id: string, userId: string) {
        // delete chunks then document in one tx; throws P2025 (404) if document is missing or not owned by user
        const document = await this.db.$transaction(async (tx) => {
            await tx.documentChunk.deleteMany({ where: { documentId: id, document: { userId } } })
            return tx.document.delete({ where: { id, userId } })
        })

        // db is source of truth, so a failed s3 delete only leaves an orphan file
        await this.s3Service.delete(document.s3key).catch((e) => this.logger.error(e))
    }
}
