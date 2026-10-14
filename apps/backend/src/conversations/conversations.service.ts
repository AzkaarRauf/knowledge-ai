import { Injectable } from '@nestjs/common'
import { CreateConversationRequestDto } from './dto/create-conversation-request.dto.js'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { CreateConversationResponseDto } from './dto/create-conversation-response.dto.js'
import { ConversationsQueryDto } from './dto/conversations-query.dto.js'
import { buildPaginationMeta, toPrismaPagination } from 'src/common/utils/pagination.js'
import { ConversationWhereInput } from 'src/generated/prisma/models.js'
import { ConversationsResponseDto } from './dto/conversations-response.dto.js'
import { ConversationResponseDto } from './dto/conversation-response.dto.js'
import { UpdateConversationResponseDto } from './dto/update-conversation-response.dto.js'
import { UpdateConversationRequestDto } from './dto/update-conversation-request.dto.js'

@Injectable()
export class ConversationsService {
    constructor(private db: PrismaService) {}

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
                orderBy: { [query.sortBy]: query.sortOrder, id: 'asc' },
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
