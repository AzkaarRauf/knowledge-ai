import { TextLoader } from '@langchain/classic/document_loaders/fs/text'
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx'
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { DocumentLoader } from '@langchain/core/document_loaders/base'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { DelayedError } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { AI_QUOTA } from 'src/ai-quota/ai-quota.constants.js'
import { AiDailyLimitException, RateLimitUnavailableException } from 'src/common/exceptions/rate-limit.exceptions.js'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { DocumentStatus } from 'src/generated/prisma/enums.js'
import { join, sql } from 'src/generated/prisma/internal/prismaNamespace.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { CACHE_RESOURCE } from 'src/redis/cache-resource.constants.js'
import { CacheVersionService } from 'src/redis/cache-version.service.js'
import { S3Service } from 'src/s3/s3.service.js'
import { DocumentProcessingJobs, JobOf, QueueNames } from './queue.constants.js'

// when redis is down, try the job again after this long
const REDIS_DOWN_RETRY_MS = 60_000

// waiting for the row lock counts toward the timeout, and a big doc inserts many rows, so the 5s default is too short
const CHUNK_WRITE_TX_OPTIONS = { maxWait: 10_000, timeout: 30_000 }

@Processor(QueueNames.documentProcessing)
export class DocumentProcessingConsumer extends WorkerHost {
    private logger = new Logger(DocumentProcessingConsumer.name)

    constructor(
        private db: PrismaService,
        private s3Service: S3Service,
        private embeddingService: EmbeddingService,
        private cacheVersionService: CacheVersionService,
    ) {
        super()
    }

    async process(job: JobOf<DocumentProcessingJobs>, token?: string) {
        switch (job.name) {
            case 'process':
                try {
                    return await this.processDocument(job, token)
                } catch (e) {
                    // job was moved to delayed (quota), it runs again later
                    if (e instanceof DelayedError) throw e
                    // no auto retries, so any error means FAILED
                    await this.setStatus(job.data.documentId, DocumentStatus.FAILED).catch((err) => this.logger.error(err))
                    throw e
                }
        }
    }

    // updateMany so a doc deleted mid-job does not throw. bump cache so lists show the new status.
    // never overwrite DONE: if the same job runs twice, the late run must not undo a finished one
    private async setStatus(documentId: string, status: DocumentStatus) {
        await this.db.document.updateMany({
            where: { id: documentId, status: { not: DocumentStatus.DONE } },
            data: { status },
        })
        await this.cacheVersionService.inc([CACHE_RESOURCE.documents])
    }

    private async processDocument(job: JobOf<DocumentProcessingJobs>, token?: string) {
        const { documentId, mimetype } = job.data
        // doc may be deleted before the job runs; nothing to do then
        const document = await this.db.document.findUnique({
            where: { id: documentId },
            select: { s3key: true, filename: true },
        })
        if (!document) {
            this.logger.warn(`Document ${documentId} not found, skipping`)
            return
        }
        await this.setStatus(documentId, DocumentStatus.PROCESSING)

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
            this.logger.warn(`Document ${documentId} has no text, marking failed`)
            await this.setStatus(documentId, DocumentStatus.FAILED)
            return
        }

        // a doc must fit one day of ingestion quota, else it can never finish
        if (split.length > AI_QUOTA.ingestion.perDay) {
            this.logger.warn(
                `Document ${documentId} has ${split.length} chunks, more than the daily AI limit of ${AI_QUOTA.ingestion.perDay}, marking failed`,
            )
            await this.setStatus(documentId, DocumentStatus.FAILED)
            return
        }

        // embedding
        let embeds: number[][]
        try {
            embeds = await this.embeddingService.embedDocuments(split)
        } catch (e) {
            // quota used up today, or redis down: run the job again later instead of failing it
            const runAt =
                e instanceof AiDailyLimitException
                    ? e.resetAt.getTime()
                    : e instanceof RateLimitUnavailableException
                      ? Date.now() + REDIS_DOWN_RETRY_MS
                      : null
            if (runAt === null) throw e
            this.logger.warn(`Document ${documentId} delayed until ${new Date(runAt).toISOString()}: ${(e as Error).message}`)
            await this.setStatus(documentId, DocumentStatus.PENDING)
            await job.moveToDelayed(runAt, token)
            throw new DelayedError()
        }

        // delete old chunks first so a rerun does not duplicate them. status flips to DONE with the chunks
        await this.db.$transaction(async (tx) => {
            // lock the document row. if the same job runs twice after a stall, the second one waits here
            // and then deletes the first one's chunks, so no duplicates
            await tx.$executeRaw`SELECT 1 FROM "Document" WHERE id = ${documentId}::uuid FOR UPDATE`
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
            await tx.document.updateMany({ where: { id: documentId }, data: { status: DocumentStatus.DONE } })
        }, CHUNK_WRITE_TX_OPTIONS)
        await this.cacheVersionService.inc([CACHE_RESOURCE.documents])
    }
}
