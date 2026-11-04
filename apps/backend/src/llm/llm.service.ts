import { StringOutputParser } from '@langchain/core/output_parsers'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { ChatGoogleGenerativeAI } from '@langchain/google-genai'
import { Injectable } from '@nestjs/common'
import { MessageRole } from 'src/generated/prisma/enums.js'
import { AIMessage, HumanMessage, SystemMessage, trimMessages } from '@langchain/core/messages'
import { AiQuotaService } from 'src/ai-quota/ai-quota.service.js'
import { geminiRetryAfterMs } from 'src/ai-quota/gemini-error.js'
import { AiBusyException } from 'src/common/exceptions/rate-limit.exceptions.js'

@Injectable()
export class LLMService {
    constructor(private aiQuotaService: AiQuotaService) {}

    // private model =  'gemini-3.1-flash-lite'
    // quota for this model lives in AI_QUOTA.llm (ai-quota.constants.ts)
    private model = 'gemini-3.5-flash-lite'
    // no retries: each retry is one more call against the quota
    private llm = new ChatGoogleGenerativeAI({ model: this.model, maxRetries: 0, temperature: 0.2 })
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
        const stream = await this.withRateLimit(this.chain.stream({ history: trimmed, prompt, context }))
        const iterator = stream[Symbol.asyncIterator]()
        // pull the first chunk now, so a gemini 429 throws before the caller sends sse headers
        const first = await this.withRateLimit(iterator.next())
        return (async function* () {
            if (first.done) return
            yield first.value
            for (let next = await iterator.next(); !next.done; next = await iterator.next()) {
                yield next.value
            }
        })()
    }

    /** gemini calls one chat makes. the caller reserves this much quota before chatting */
    chatCallCount(history: ReturnType<LLMService['toHistory']>) {
        // no history means no rewrite call
        return history.length === 0 ? 1 : 2
    }

    // a gemini 429 pauses the llm quota and becomes AI_BUSY
    private async withRateLimit<T>(promise: Promise<T>) {
        try {
            return await promise
        } catch (e) {
            const retryAfterMs = geminiRetryAfterMs(e)
            if (retryAfterMs === null) throw e
            await this.aiQuotaService.cooldown('llm', retryAfterMs)
            throw new AiBusyException(retryAfterMs / 1000)
        }
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
        if (this.chatCallCount(history) === 1) return prompt
        const trimmed = await this.trimHistory(history)
        return this.withRateLimit(this.rewriteChain.invoke({ history: trimmed, prompt }))
    }
}
