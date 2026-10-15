import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { RAGService } from './rag.service.js'

const conversationId = '0b8f8f5e-3c1a-4d2b-9a43-7c1d1f0a2e33'

describe('RAGService', () => {
    let service: RAGService
    const db = { $queryRaw: vi.fn() }
    const embeddingService = { embedQuery: vi.fn() }

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
        const chunks = [
            { id: 'c1', content: 'chunk one', metadata: {}, distance: 0.1 },
            { id: 'c2', content: 'chunk two', metadata: {}, distance: 0.2 },
        ]

        beforeEach(() => {
            embeddingService.embedQuery.mockResolvedValue([0.1, 0.2])
            db.$queryRaw.mockResolvedValue(chunks)
        })

        it('searches chunks with the prompt embedding and conversation id', async () => {
            await service.retrieveDocumentChunks({ prompt: 'what is x?', conversationId })

            expect(embeddingService.embedQuery).toHaveBeenCalledWith('what is x?')
            const values = db.$queryRaw.mock.calls[0].slice(1)
            expect(values).toContain('[0.1,0.2]')
            expect(values).toContain(conversationId)
        })

        it('returns the found chunks', async () => {
            await expect(service.retrieveDocumentChunks({ prompt: 'what is x?', conversationId })).resolves.toEqual(chunks)
        })
    })
})
