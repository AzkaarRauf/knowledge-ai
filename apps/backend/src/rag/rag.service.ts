import { Injectable } from '@nestjs/common'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'

@Injectable()
export class RAGService {
    constructor(
        private embeddingService: EmbeddingService,
        private db: PrismaService,
    ) {}

    async retrieveDocumentChunks(args: { prompt: string; conversationId: string }) {
        const { prompt, conversationId } = args
        // embed the prompt
        const promptEmbed = await this.embeddingService.embedQuery(prompt)
        // perform vector search and find the results. no result means invalid question.
        const vector = `[${promptEmbed.join(',')}]`
        // max cosine distance. chunks above this are not relevant enough
        const maxDistance = 0.5
        const chunks = await this.db.$queryRaw<{ id: string; content: string; metadata: unknown; distance: number }[]>`
            SELECT c."id", c."content", c."metadata", c."embedding" <=> ${vector}::vector AS "distance"
            FROM "DocumentChunk" c
            JOIN "Document" d ON d."id" = c."documentId"
            JOIN "Conversation" conv ON conv."id" = ${conversationId}::uuid
            WHERE
                (d."conversationId" IS NULL OR d."conversationId" = conv."id")
                AND
                -- docs with no department are shared with every department
                (d."departmentId" IS NULL OR d."departmentId" = conv."departmentId")
                AND
                (c."embedding" <=> ${vector}::vector < ${maxDistance})
            ORDER BY "distance"
            LIMIT 20`
        return chunks
    }
}
