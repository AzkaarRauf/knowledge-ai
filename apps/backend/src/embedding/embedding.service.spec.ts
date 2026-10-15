import { Document } from '@langchain/core/documents'
import { Test, TestingModule } from '@nestjs/testing'
import { EmbeddingService } from './embedding.service.js'

// fake google client so no real api call is made
const google = vi.hoisted(() => ({
    ctorArgs: vi.fn(),
    embedDocuments: vi.fn(),
    embedQuery: vi.fn(),
}))

vi.mock('@langchain/google-genai', () => ({
    GoogleGenerativeAIEmbeddings: class {
        constructor(args: unknown) {
            google.ctorArgs(args)
        }
        embedDocuments = google.embedDocuments
        embedQuery = google.embedQuery
    },
}))

describe('EmbeddingService', () => {
    let service: EmbeddingService

    beforeEach(async () => {
        vi.resetAllMocks()

        const module: TestingModule = await Test.createTestingModule({
            providers: [EmbeddingService],
        }).compile()

        service = module.get<EmbeddingService>(EmbeddingService)
    })

    it('creates the google client with the 768 dim embedding model', () => {
        expect(google.ctorArgs).toHaveBeenCalledWith({ model: 'gemini-embedding-2', outputDimensionality: 768 })
    })

    describe('embedDocuments', () => {
        it('embeds the page content of each document', async () => {
            google.embedDocuments.mockResolvedValue([[0.1], [0.2]])
            const docs = [new Document({ pageContent: 'first' }), new Document({ pageContent: 'second' })]

            await expect(service.embedDocuments(docs)).resolves.toEqual([[0.1], [0.2]])
            expect(google.embedDocuments).toHaveBeenCalledWith(['first', 'second'])
        })
    })

    describe('embedQuery', () => {
        it('embeds the query text', async () => {
            google.embedQuery.mockResolvedValue([0.1, 0.2])

            await expect(service.embedQuery('what is x?')).resolves.toEqual([0.1, 0.2])
            expect(google.embedQuery).toHaveBeenCalledWith('what is x?')
        })
    })
})
