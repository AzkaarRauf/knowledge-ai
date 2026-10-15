import { BaseMessage } from '@langchain/core/messages'
import { Test, TestingModule } from '@nestjs/testing'
import { LLMService } from './llm.service.js'

// messages the fake model got on its last call
const received = vi.hoisted(() => ({ messages: [] as BaseMessage[] }))

// swap gemini for a fake model that echoes back every message it gets. no real api call is made
vi.mock('@langchain/google-genai', async () => {
    const { FakeChatModel } = await import('@langchain/core/utils/testing')
    return {
        ChatGoogleGenerativeAI: class extends FakeChatModel {
            constructor() {
                super({})
            }
            override _generate(...args: Parameters<InstanceType<typeof FakeChatModel>['_generate']>) {
                received.messages = args[0]
                return super._generate(...args)
            }
        },
    }
})

describe('LLMService', () => {
    let service: LLMService

    beforeEach(async () => {
        received.messages = []

        const module: TestingModule = await Test.createTestingModule({
            providers: [LLMService],
        }).compile()

        service = module.get<LLMService>(LLMService)
    })

    describe('toHistory', () => {
        it('maps messages to [role, content] tuples', () => {
            expect(
                service.toHistory([
                    { role: 'user', content: 'hi' },
                    { role: 'assistant', content: 'hello' },
                ]),
            ).toEqual([
                ['user', 'hi'],
                ['assistant', 'hello'],
            ])
        })
    })

    describe('stream', () => {
        it('sends system prompt with context, then history, then the prompt', async () => {
            const history = service.toHistory([
                { role: 'user', content: 'old question' },
                { role: 'assistant', content: 'old answer' },
            ])

            const stream = await service.stream({ history, prompt: 'new question', context: 'some context' })
            let text = ''
            for await (const chunk of stream) {
                text += chunk.text
            }

            expect(received.messages.map((m) => m.type)).toEqual(['system', 'human', 'ai', 'human'])
            expect(received.messages[0].text).toContain('Context: some context')
            expect(received.messages.slice(1).map((m) => m.text)).toEqual(['old question', 'old answer', 'new question'])
            // fake model echoes input, so the streamed text holds the prompt
            expect(text).toContain('new question')
        })
    })
})
