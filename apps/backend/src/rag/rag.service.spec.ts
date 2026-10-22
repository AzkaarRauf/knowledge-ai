import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { sql } from 'src/generated/prisma/internal/prismaNamespace.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { RAGService } from './rag.service.js'

const conversationId = '0b8f8f5e-3c1a-4d2b-9a43-7c1d1f0a2e33'

describe('RAGService', () => {
    let service: RAGService
    const db = { $queryRaw: vi.fn() }
    const embeddingService = { embedQuery: vi.fn() }

    // rebuild the tagged template call so nested sql fragments are flattened
    const queryAt = (i: number) => {
        const [strings, ...values] = db.$queryRaw.mock.calls[i]
        return sql(strings, ...values)
    }

    beforeEach(async () => {
        vi.resetAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RAGService,
                { provide: PrismaService, useValue: db },
                { provide: EmbeddingService, useValue: embeddingService },
            ],
        }).compile()

        service = module.get<RAGService>(RAGService)
    })

    describe('retrieveDocumentChunks', () => {
        const c1 = { id: 'c1', content: 'chunk one', metadata: {} }
        const c2 = { id: 'c2', content: 'chunk two', metadata: {} }
        const c3 = { id: 'c3', content: 'chunk three', metadata: {} }

        beforeEach(() => {
            embeddingService.embedQuery.mockResolvedValue([0.1, 0.2])
            db.$queryRaw.mockImplementation((strings: TemplateStringsArray) =>
                Promise.resolve(strings.join('').includes('<=>') ? [c1, c2] : [c2, c3]),
            )
        })

        it('runs a vector search with the prompt embedding and conversation id', async () => {
            await service.retrieveDocumentChunks({ prompt: 'what is x?', conversationId })

            expect(embeddingService.embedQuery).toHaveBeenCalledWith('what is x?')
            const query = [0, 1].map(queryAt).find((q) => q.sql.includes('<=>'))
            expect(query?.values).toContain('[0.1,0.2]')
            expect(query?.values).toContain(conversationId)
        })

        it('runs a text search with the prompt text and conversation id', async () => {
            await service.retrieveDocumentChunks({ prompt: 'what is x?', conversationId })

            const query = [0, 1].map(queryAt).find((q) => q.sql.includes('@@'))
            expect(query?.values).toContain('what is x?')
            expect(query?.values).toContain(conversationId)
        })

        it('merges both results, ranking chunks found by both searches first', async () => {
            const chunks = await service.retrieveDocumentChunks({ prompt: 'what is x?', conversationId })

            expect(chunks.map((c) => c.id)).toEqual(['c2', 'c1', 'c3'])
            expect(chunks[0]).toMatchObject({ ...c2, score: expect.any(Number) })
        })
    })
})
