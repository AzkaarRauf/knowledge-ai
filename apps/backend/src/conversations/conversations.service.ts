import { Injectable, Logger } from '@nestjs/common'
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

@Injectable()
export class ConversationsService {
    private logger = new Logger(ConversationsService.name)

    constructor(
        private db: PrismaService,
        private ragService: RAGService,
        private llmService: LLMService,
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

        const rewrittenPrompt = await this.llmService.rewriteQuery({ history, prompt })
        const chunks = await this.ragService.retrieveDocumentChunks({ prompt: rewrittenPrompt, conversationId: id })
        const context = chunks.map((chunk) => chunk.content).join('\n\n')

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
        let finalContent = ''
        try {
            for await (const chunk of stream) {
                finalContent += chunk.text
                res.write(`event: chunk\ndata: ${JSON.stringify(chunk.text)}\n\n`)
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
        } catch (e) {
            this.logger.error(e)
            res.write(`event: error\n`)
            res.write(`data: ${JSON.stringify('Something went wrong')}\n\n`)
        } finally {
            res.write(`event: done\n`)
            res.write(`data: \n\n`)
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
            }),
            this.db.message.count({ where }),
        ])
        return { data: messages, meta: buildPaginationMeta(query, total) }
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
