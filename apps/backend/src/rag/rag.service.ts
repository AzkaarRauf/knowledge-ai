import { Injectable } from '@nestjs/common'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { sql } from 'src/generated/prisma/internal/prismaNamespace.js'
import { PrismaService } from 'src/prisma/prisma.service.js'

type Chunk = { id: string; content: string; metadata: unknown }

// max cosine distance. vector hits above this are not relevant enough
const maxDistance = 0.5
// how many hits each search gives before merging
const candidates = 50
// RRF constant. higher means top ranks matter less
const rrfK = 60
// how many merged chunks to return
const limit = 20

@Injectable()
export class RAGService {
    constructor(
        private embeddingService: EmbeddingService,
        private db: PrismaService,
    ) {}

    // hybrid search: vector search and full-text search run in parallel, then merged with reciprocal rank fusion (RRF).
    // no result means invalid question.
    async retrieveDocumentChunks(args: { prompt: string; conversationId: string }) {
        const { prompt, conversationId } = args
        const [vectorHits, textHits] = await Promise.all([
            this.vectorSearch(prompt, conversationId),
            this.textSearch(prompt, conversationId),
        ])
        return this.fuse([vectorHits, textHits])
    }

    private async vectorSearch(prompt: string, conversationId: string) {
        const promptEmbed = await this.embeddingService.embedQuery(prompt)
        const vector = `[${promptEmbed.join(',')}]`
        return this.db.$queryRaw<Chunk[]>`
            SELECT c."id", c."content", c."metadata"
            ${this.scopedChunks(conversationId)}
                AND c."embedding" <=> ${vector}::vector < ${maxDistance}
            ORDER BY c."embedding" <=> ${vector}::vector
            LIMIT ${candidates}`
    }

    private textSearch(prompt: string, conversationId: string) {
        // OR the prompt words together. plain AND needs every word in one chunk, too strict for questions
        const query = sql`replace(plainto_tsquery('english', ${prompt})::text, '&', '|')::tsquery`
        return this.db.$queryRaw<Chunk[]>`
            SELECT c."id", c."content", c."metadata"
            ${this.scopedChunks(conversationId)}
                AND c."contentSearch" @@ ${query}
            ORDER BY ts_rank_cd(c."contentSearch", ${query}) DESC
            LIMIT ${candidates}`
    }

    // FROM + WHERE for chunks the conversation can see. callers add more conditions with AND
    private scopedChunks(conversationId: string) {
        return sql`
            FROM "DocumentChunk" c
            JOIN "Document" d ON d."id" = c."documentId"
            JOIN "Conversation" conv ON conv."id" = ${conversationId}::uuid
            WHERE
                (d."conversationId" IS NULL OR d."conversationId" = conv."id")
                AND
                -- docs with no department are shared with every department
                (d."departmentId" IS NULL OR d."departmentId" = conv."departmentId")`
    }

    // each list adds 1 / (rrfK + rank) to a chunk's score, so chunks found by both searches rank highest
    private fuse(lists: Chunk[][]) {
        const scored = new Map<string, Chunk & { score: number }>()
        for (const list of lists) {
            list.forEach((chunk, i) => {
                const existing = scored.get(chunk.id) ?? { ...chunk, score: 0 }
                existing.score += 1 / (rrfK + i + 1)
                scored.set(chunk.id, existing)
            })
        }
        return [...scored.values()].sort((a, b) => b.score - a.score).slice(0, limit)
    }
}
