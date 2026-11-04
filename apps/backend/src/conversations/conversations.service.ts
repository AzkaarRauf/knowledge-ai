import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Response } from 'express'
import { buildPaginationMeta, toPrismaPagination } from 'src/common/utils/pagination.js'
import { ConversationWhereInput, MessageWhereInput } from 'src/generated/prisma/models.js'
import { LLMService } from 'src/llm/llm.service.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { RAGService } from 'src/rag/rag.service.js'
import { ChatRequestDto } from './dto/chat-request.dto.js'
import { ConversationResponseDto } from './dto/conversation-response.dto.js'
import { ConversationsQueryDto } from './dto/conversations-query.dto.js'
import { ConversationsResponseDto } from './dto/conversations-response.dto.js'
import { CreateConversationRequestDto } from './dto/create-conversation-request.dto.js'
import { CreateConversationResponseDto } from './dto/create-conversation-response.dto.js'
import { MessagesQueryDto } from './dto/messages-query.dto.js'
import { MessagesResponseDto } from './dto/messages-response.dto.js'
import { UpdateConversationRequestDto } from './dto/update-conversation-request.dto.js'
import { UpdateConversationResponseDto } from './dto/update-conversation-response.dto.js'
import { FeedbackResponseDto } from './dto/feedback-response.dto.js'
import { UpsertFeedbackRequestDto } from './dto/upsert-feedback-request.dto.js'
import { CacheVersionService } from 'src/redis/cache-version.service.js'
import { CACHE_RESOURCE } from 'src/redis/cache-resource.constants.js'
import { AiQuotaService } from 'src/ai-quota/ai-quota.service.js'

@Injectable()
export class ConversationsService {
    private logger = new Logger(ConversationsService.name)

    constructor(
        private db: PrismaService,
        private ragService: RAGService,
        private llmService: LLMService,
        private cacheVersionService: CacheVersionService,
        private aiQuotaService: AiQuotaService,
    ) {}

    async chat(args: { id: string; userId: string; chatDto: ChatRequestDto; res: Response }) {
        const {
            chatDto: { prompt },
            id,
            userId,
            res,
        } = args
        // time the user sent the prompt. keeps user msg before assistant msg when sorting
        const promptSentAt = new Date()
        // throws P2025 (404) if conversation is missing or not owned by user
        const { messages } = await this.db.conversation.findFirstOrThrow({
            where: { id, userId },
            select: {
                messages: {
                    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
                    select: { role: true, content: true },
                },
            },
        })
        const history = this.llmService.toHistory(messages)

        // reserve gemini quota for the whole chat (llm calls + 1 query embed), so it never stops halfway.
        // throws 429/503 as json, before any sse header is sent
        await this.aiQuotaService.reserveChat({ llmCalls: this.llmService.chatCallCount(history) })

        const rewrittenPrompt = await this.llmService.rewriteQuery({ history, prompt })
        const chunks = await this.ragService.retrieveDocumentChunks({ prompt: rewrittenPrompt, conversationId: id })
        const context = chunks
            .map((chunk) => {
                const content = `content:${JSON.stringify(chunk.content)}`
                if (typeof chunk.metadata === 'object' && chunk.metadata !== null && 'source' in chunk.metadata) {
                    return content + `\nmetadata:${JSON.stringify({ source: chunk.metadata.source })}`
                }
                return content
            })
            .join('\n\n')

        const stream = await this.llmService.stream({ history, prompt, context })

        // stream the response back to user
        res.setHeaders(
            new Map([
                ['Content-Type', 'text/event-stream'],
                ['Cache-Control', 'no-cache, no-transform'],
                ['Connection', 'keep-alive'],
            ]),
        )
        res.flushHeaders()
        const writeEvent = <T>(event: 'chunk' | 'error' | 'total-tokens', data: T) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        }
        let finalContent = ''
        let totalTokens = 0
        try {
            for await (const chunk of stream) {
                finalContent += chunk.text
                writeEvent('chunk', chunk.text)
                totalTokens += chunk.usage_metadata?.total_tokens ?? 0
            }
            // save to db after stream ends
            const answeredAt = new Date()
            await this.db.$transaction([
                this.db.conversation.update({ data: { updatedAt: answeredAt }, where: { userId, id } }),
                this.db.message.createMany({
                    data: [
                        { content: prompt, role: 'user', conversationId: id, createdAt: promptSentAt },
                        { content: finalContent, role: 'assistant', conversationId: id, createdAt: answeredAt },
                    ],
                }),
            ])
            await this.cacheVersionService.inc([CACHE_RESOURCE.conversations])
        } catch (e) {
            this.logger.error(e)
            writeEvent('error', 'Something went wrong')
        } finally {
            writeEvent('total-tokens', totalTokens)
            res.write(`event: done\ndata: \n\n`)
            res.end()
        }

        return
    }

    async create(createConversationDto: CreateConversationRequestDto, userId: string): Promise<CreateConversationResponseDto> {
        const conversation = await this.db.conversation.create({
            data: { ...createConversationDto, userId },
        })
        return conversation
    }

    async findAll({ userId, query }: { userId: string; query: ConversationsQueryDto }): Promise<ConversationsResponseDto> {
        const where: ConversationWhereInput = {
            userId,
            ...(query.search && {
                title: { contains: query.search, mode: 'insensitive' } satisfies ConversationWhereInput['title'],
            }),
        }
        const [conversations, total] = await this.db.$transaction([
            this.db.conversation.findMany({
                where,
                orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }],
                ...toPrismaPagination(query),
            }),
            this.db.conversation.count({ where }),
        ])
        return { data: conversations, meta: buildPaginationMeta(query, total) }
    }

    async findOne({ id, userId }: { id: string; userId: string }): Promise<ConversationResponseDto> {
        const conversation = await this.db.conversation.findFirstOrThrow({ where: { id, userId } })
        return conversation
    }

    async findAllMessages(args: { id: string; userId: string; query: MessagesQueryDto }): Promise<MessagesResponseDto> {
        const { id, userId, query } = args
        // throws P2025 (404) if conversation is missing or not owned by user
        await this.db.conversation.findFirstOrThrow({ where: { id, userId }, select: { id: true } })
        const where: MessageWhereInput = {
            conversationId: id,
            ...(query.search && {
                content: { contains: query.search, mode: 'insensitive' } satisfies MessageWhereInput['content'],
            }),
        }
        const [messages, total] = await this.db.$transaction([
            this.db.message.findMany({
                where,
                orderBy: [{ [query.sortBy]: query.sortOrder }, { id: 'asc' }],
                ...toPrismaPagination(query),
                // only this user's rating
                include: { feedback: { where: { userId }, select: { rating: true } } },
            }),
            this.db.message.count({ where }),
        ])
        return {
            data: messages.map(({ feedback, ...message }) => ({ ...message, feedback: feedback[0]?.rating ?? null })),
            meta: buildPaginationMeta(query, total),
        }
    }

    async upsertFeedback(args: {
        id: string
        messageId: string
        userId: string
        upsertFeedbackDto: UpsertFeedbackRequestDto
    }): Promise<FeedbackResponseDto> {
        const { id, messageId, userId, upsertFeedbackDto } = args
        // throws P2025 (404) if message is missing or its conversation is not owned by user
        const message = await this.db.message.findFirstOrThrow({
            where: { id: messageId, conversationId: id, conversation: { userId } },
            select: { role: true },
        })
        if (message.role !== 'assistant') {
            throw new BadRequestException('Only assistant messages can be rated')
        }
        const data = { rating: upsertFeedbackDto.rating, comment: upsertFeedbackDto.comment ?? null }
        return this.db.feedback.upsert({
            where: { messageId_userId: { messageId, userId } },
            create: { ...data, messageId, userId },
            update: data,
        })
    }

    async removeFeedback({ id, messageId, userId }: { id: string; messageId: string; userId: string }) {
        await this.db.feedback.deleteMany({ where: { messageId, userId, message: { conversationId: id } } })
    }

    async update(args: {
        id: string
        updateConversationDto: UpdateConversationRequestDto
        userId: string
    }): Promise<UpdateConversationResponseDto> {
        const { id, updateConversationDto, userId } = args
        const conversation = await this.db.conversation.update({
            where: { id, userId },
            data: updateConversationDto,
        })
        return conversation
    }

    async remove({ id, userId }: { id: string; userId: string }) {
        await this.db.$transaction([
            this.db.message.deleteMany({ where: { conversationId: id } }),
            this.db.conversation.delete({ where: { id, userId } }),
        ])
    }
}
