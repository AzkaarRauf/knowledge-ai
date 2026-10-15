import { Logger } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { type Response } from 'express'
import { EmbeddingService } from 'src/embedding/embedding.service.js'
import { LLMService } from 'src/llm/llm.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { ConversationsService } from './conversations.service.js'

const id = '0b8f8f5e-3c1a-4d2b-9a43-7c1d1f0a2e33'
const userId = '6f1c2b1e-8a0e-4c7a-9a43-2f2a3a1d9b10'

// fake llm stream that yields the given text chunks, then throws if an error is given
async function* fakeStream(chunks: string[], error?: Error) {
    for (const text of chunks) {
        yield { text }
    }
    if (error) throw error
}

describe('ConversationsService', () => {
    let service: ConversationsService
    const db = {
        conversation: { findFirstOrThrow: vi.fn(), update: vi.fn() },
        message: { findMany: vi.fn(), createMany: vi.fn() },
        $queryRaw: vi.fn(),
        $transaction: vi.fn(),
    }
    const embeddingService = { embedQuery: vi.fn() }
    const llmService = { toHistory: vi.fn(), stream: vi.fn() }
    const res = { setHeaders: vi.fn(), flushHeaders: vi.fn(), write: vi.fn(), end: vi.fn() }

    // everything written to the response, joined
    const written = () => res.write.mock.calls.map(([s]) => s as string).join('')

    beforeEach(async () => {
        vi.resetAllMocks()
        vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {})

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConversationsService,
                { provide: PrismaService, useValue: db },
                { provide: EmbeddingService, useValue: embeddingService },
                { provide: LLMService, useValue: llmService },
            ],
        }).compile()

        service = module.get<ConversationsService>(ConversationsService)
    })

    describe('chat', () => {
        const chat = () => service.chat({ id, userId, chatDto: { prompt: 'what is x?' }, res: res as unknown as Response })
        const history = [['user', 'old question']]

        beforeEach(() => {
            db.conversation.findFirstOrThrow.mockResolvedValue({ id })
            embeddingService.embedQuery.mockResolvedValue([0.1, 0.2])
            db.$queryRaw.mockResolvedValue([
                { id: 'c1', content: 'chunk one', metadata: {}, distance: 0.1 },
                { id: 'c2', content: 'chunk two', metadata: {}, distance: 0.2 },
            ])
            db.message.findMany.mockResolvedValue([{ role: 'user', content: 'old question' }])
            llmService.toHistory.mockReturnValue(history)
            db.$transaction.mockResolvedValue([])
        })

        it('rejects and calls no ai api when the conversation is missing or not owned', async () => {
            db.conversation.findFirstOrThrow.mockRejectedValue(new Error('P2025'))

            await expect(chat()).rejects.toThrow('P2025')
            expect(db.conversation.findFirstOrThrow).toHaveBeenCalledWith({ where: { id, userId }, select: { id: true } })
            expect(embeddingService.embedQuery).not.toHaveBeenCalled()
            expect(llmService.stream).not.toHaveBeenCalled()
            expect(res.write).not.toHaveBeenCalled()
        })

        it('searches chunks with the prompt embedding and conversation id', async () => {
            llmService.stream.mockResolvedValue(fakeStream([]))

            await chat()

            expect(embeddingService.embedQuery).toHaveBeenCalledWith('what is x?')
            const values = db.$queryRaw.mock.calls[0].slice(1)
            expect(values).toContain('[0.1,0.2]')
            expect(values).toContain(id)
        })

        it('passes history, prompt and joined chunk context to the llm', async () => {
            llmService.stream.mockResolvedValue(fakeStream([]))

            await chat()

            expect(db.message.findMany).toHaveBeenCalledWith({
                where: { conversationId: id },
                orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
                select: { role: true, content: true },
            })
            expect(llmService.toHistory).toHaveBeenCalledWith([{ role: 'user', content: 'old question' }])
            expect(llmService.stream).toHaveBeenCalledWith({ history, prompt: 'what is x?', context: 'chunk one\n\nchunk two' })
        })

        it('streams json encoded sse chunks, then a done event, then ends', async () => {
            llmService.stream.mockResolvedValue(fakeStream(['Hello', ' line\nbreak']))

            await chat()

            expect(res.setHeaders).toHaveBeenCalledWith(
                new Map([
                    ['Content-Type', 'text/event-stream'],
                    ['Cache-Control', 'no-cache'],
                    ['Connection', 'keep-alive'],
                ]),
            )
            expect(res.flushHeaders).toHaveBeenCalled()
            expect(written()).toBe(
                'event: chunk\ndata: "Hello"\n\n' + 'event: chunk\ndata: " line\\nbreak"\n\n' + 'event: done\ndata: \n\n',
            )
            expect(res.end).toHaveBeenCalledTimes(1)
        })

        it('saves the prompt and full answer and bumps conversation updatedAt', async () => {
            llmService.stream.mockResolvedValue(fakeStream(['Hello', ' world']))
            db.conversation.update.mockReturnValue('update-op')
            db.message.createMany.mockReturnValue('create-op')

            await chat()

            expect(db.$transaction).toHaveBeenCalledWith(['update-op', 'create-op'])
            const { data } = db.message.createMany.mock.calls[0][0]
            expect(data).toEqual([
                { content: 'what is x?', role: 'user', conversationId: id, createdAt: expect.any(Date) },
                { content: 'Hello world', role: 'assistant', conversationId: id, createdAt: expect.any(Date) },
            ])
            // user msg must sort before assistant msg
            expect(data[0].createdAt.getTime()).toBeLessThanOrEqual(data[1].createdAt.getTime())
            expect(db.conversation.update).toHaveBeenCalledWith({
                data: { updatedAt: data[1].createdAt },
                where: { userId, id },
            })
        })

        it('sends a generic error event and saves nothing when the stream fails', async () => {
            llmService.stream.mockResolvedValue(fakeStream(['partial'], new Error('gemini secret details')))

            await chat()

            expect(written()).toContain('event: error\ndata: "Something went wrong"\n\n')
            expect(written()).not.toContain('gemini secret details')
            expect(written().endsWith('event: done\ndata: \n\n')).toBe(true)
            expect(db.$transaction).not.toHaveBeenCalled()
            expect(res.end).toHaveBeenCalledTimes(1)
        })

        it('sends an error event when saving fails', async () => {
            llmService.stream.mockResolvedValue(fakeStream(['Hello']))
            db.$transaction.mockRejectedValue(new Error('db down'))

            await chat()

            expect(written()).toContain('event: error\ndata: "Something went wrong"\n\n')
            expect(res.end).toHaveBeenCalledTimes(1)
        })
    })
})
