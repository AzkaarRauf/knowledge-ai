import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DocumentLoader } from '@langchain/core/document_loaders/base'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { join, sql } from 'src/generated/prisma/internal/prismaNamespace.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { S3Service } from 'src/s3/s3.service.js'
import { DocumentProcessingJobs, JobOf, QueueNames } from './queue.constants.js'

@Processor(QueueNames.documentProcessing)
export class DocumentProcessingConsumer extends WorkerHost {
    private logger = new Logger(DocumentProcessingConsumer.name)

    constructor(
        private db: PrismaService,
        private s3Service: S3Service,
        private embeddingService: EmbeddingService,
    ) {
        super()
    }

    async process(job: JobOf<DocumentProcessingJobs>) {
        switch (job.name) {
            case 'process':
                return this.processDocument(job.data)
        }
    }

    private async processDocument({ documentId, mimetype }: DocumentProcessingJobs['process']) {
        // doc may be deleted before the job runs; nothing to do then
        const document = await this.db.document.findUnique({
            where: { id: documentId },
            select: { s3key: true, filename: true },
        })
        if (!document) {
            this.logger.warn(`Document ${documentId} not found, skipping`)
            return
        }

        const buffer = await this.s3Service.download(document.s3key)
        const blob = new Blob([new Uint8Array(buffer)], { type: mimetype })
        let loader: DocumentLoader
        switch (mimetype) {
            case 'text/plain':
                loader = new TextLoader(blob)
                break
            case 'application/pdf':
                loader = new PDFLoader(blob, { splitPages: false })
                break
            default:
                loader = new DocxLoader(blob)
                break
        }
        const docs = await loader.load()
        for (const doc of docs) {
            doc.metadata.source = document.filename
        }

        // chunking
        const textSplitter = new RecursiveCharacterTextSplitter({ chunkOverlap: 200, chunkSize: 1000 })
        const split = await textSplitter.splitDocuments(docs)
        if (split.length === 0) {
            this.logger.warn(`Document ${documentId} has no text, skipping`)
            return
        }

        // embedding
        const embeds = await this.embeddingService.embedDocuments(split)

        // delete old chunks first so a retry does not duplicate them
        await this.db.$transaction(async (tx) => {
            await tx.documentChunk.deleteMany({ where: { documentId } })
            const rows = split.map(
                (item, i) =>
                    sql`(
                            ${randomUUID()}::uuid,
                            ${item.pageContent},
                            to_tsvector('english', ${item.pageContent}),
                            ${`[${embeds[i].join(',')}]`}::vector,
                            ${documentId}::uuid, ${JSON.stringify(item.metadata)}::jsonb,
                            now()
                          )`,
            )
            await tx.$executeRaw`
                  INSERT INTO "DocumentChunk" ("id", "content", "contentSearch", "embedding", "documentId", "metadata", "updatedAt")
                  VALUES ${join(rows)}`
        })
    }
}
