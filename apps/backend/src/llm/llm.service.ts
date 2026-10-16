import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { Injectable } from '@nestjs/common'
import { MessageRole } from 'src/generated/prisma/enums.js'

@Injectable()
export class LLMService {
    // private model =  'gemini-3.1-flash-lite'
    private model = 'gemini-3.5-flash-lite'
    private llm = new ChatGoogleGenerativeAI({ model: this.model, maxRetries: 1 })
    private template = ChatPromptTemplate.fromMessages([
        // sys prompt tells ai to ans from context only.
        [
            'system',
            `
                You are not a general purpose AI.
                You are an SME on the Context.
                You answer the questions that fall within the realm of the Context or chat history.
                You refuse to even entertain questions beyond the Context.
                An empty Context is pure horror for you. It leaves you speechless, allowing you only to politely refuse.
                Context: {context}
            `,
        ],
        new MessagesPlaceholder('history'),
        ['human', '{prompt}'],
    ])
    private chain = this.template.pipe(this.llm)

    async stream(args: { history: ReturnType<LLMService['toHistory']>; prompt: string; context: string }) {
        const { context, history, prompt } = args
        return this.chain.stream({ history, prompt, context })
    }

    toHistory(messages: { role: MessageRole; content: string }[]) {
        return messages.map((item) => [item.role, item.content] as const)
    }
}
