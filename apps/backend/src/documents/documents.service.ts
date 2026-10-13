import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DocumentLoader } from '@langchain/core/document_loaders/base'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { CharacterTextSplitter } from '@langchain/textsplitters'
import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common'
import { createHash, randomUUID } from 'node:crypto'
import { join, sql } from 'src/generated/prisma/internal/prismaNamespace.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { S3Service } from 'src/s3/s3.service.js'
import { CreateDocumentDto } from './dto/create-document.dto.js'
import { UpdateDocumentDto } from './dto/update-document.dto.js'
import { Document } from 'src/generated/prisma/client.js'
import { isError, safe } from 'shared'

@Injectable()
export class DocumentsService {
    private logger = new Logger(DocumentsService.name)

    constructor(
        private s3Service: S3Service,
        private db: PrismaService,
    ) {}

    async upload({ file, userId }: { file: Express.Multer.File; userId: string }): Promise<{
        document: Document
        isNew: boolean
    }> {
        const fileHash = createHash('sha256').update(file.buffer).digest('hex')
        const existingDocument = await this.db.document.findFirst({ where: { fileHash } })
        if (existingDocument) return { document: existingDocument, isNew: false }

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
        const embeddings = new GoogleGenerativeAIEmbeddings({
            model: 'gemini-embedding-2',
            outputDimensionality: 768,
        })
        const embeds = await embeddings.embedDocuments(split.map((item) => item.pageContent))

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

    create(createDocumentDto: CreateDocumentDto) {
        return 'This action adds a new document'
    }

    findAll() {
        return `This action returns all documents`
    }

    findOne(id: number) {
        return `This action returns a #${id} document`
    }

    update(id: number, updateDocumentDto: UpdateDocumentDto) {
        return `This action updates a #${id} document`
    }

    remove(id: number) {
        return `This action removes a #${id} document`
    }
}
