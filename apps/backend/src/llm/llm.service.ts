import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { Injectable } from '@nestjs/common'
import { MessageRole } from 'src/generated/prisma/enums.js'
import { AIMessage, HumanMessage, SystemMessage, trimMessages } from '@langchain/core/messages'

@Injectable()
export class LLMService {
    // private model =  'gemini-3.1-flash-lite'
    private model = 'gemini-3.5-flash-lite'
    private llm = new ChatGoogleGenerativeAI({ model: this.model, maxRetries: 1, temperature: 0.2 })
    private template = ChatPromptTemplate.fromMessages([
        [
            'system',
            `
                You are not a general purpose AI.
                You are an SME on the Context.
                You answer the questions that fall within the realm of the Context or chat history.
                You refuse to even entertain questions beyond the Context.
                An empty Context is pure horror for you. It leaves you speechless, allowing you only to politely refuse.
                The term "Context" or your role as an "SME" is not something you ever mention in your responses.
                Your responses must give citations from the context. Format: <<Citation {{source}}>>. e.g. <<Citation abc.pdf>>; <<Citation imp_doc.pdf>>
                Context: {context}
            `,
        ],
        new MessagesPlaceholder('history'),
        ['human', '{prompt}'],
    ])
    private chain = this.template.pipe(this.llm)

    private rewriteTemplate = ChatPromptTemplate.fromMessages([
        [
            'system',
            `
                Given the chat history and a follow-up, rewrite the follow-up as a standalone search query.
                Keep all key terms. Do NOT answer it. If already standalone, return it unchanged. Output only the query.
            `,
        ],
        new MessagesPlaceholder('history'),
        ['human', '{prompt}'],
    ])
    private rewriteChain = this.rewriteTemplate.pipe(this.llm).pipe(new StringOutputParser())

    async stream(args: { history: ReturnType<LLMService['toHistory']>; prompt: string; context: string }) {
        const { context, history, prompt } = args
        const trimmed = await this.trimHistory(history)
        return this.chain.stream({ history: trimmed, prompt, context })
    }

    // keep only the newest messages that fit the token budget
    private trimHistory(history: ReturnType<LLMService['toHistory']>) {
        return trimMessages(history, {
            tokenCounter: this.llm,
            maxTokens: 20000,
            startOn: 'human',
            strategy: 'last',
        })
    }

    toHistory(messages: { role: MessageRole; content: string }[]) {
        return messages.map((item) => {
            if (item.role === MessageRole.user) return new HumanMessage(item.content)
            if (item.role === MessageRole.assistant) return new AIMessage(item.content)
            return new SystemMessage(item.content)
        })
    }

    async rewriteQuery(args: { history: ReturnType<LLMService['toHistory']>; prompt: string }) {
        const { history, prompt } = args
        if (history.length === 0) return prompt
        const trimmed = await this.trimHistory(history)
        return this.rewriteChain.invoke({ history: trimmed, prompt })
    }
}
