import { CACHE_RESOURCE } from 'src/redis/cache-resource.constants.js'
import { Throttle } from '@nestjs/throttler'
import { STRICT_THROTTLE } from 'src/throttle/throttle.constants.js'
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Put,
    Query,
    Res,
} from '@nestjs/common'
import { ZodResponse } from 'nestjs-zod'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { JwtPayload } from 'src/decorators/jwt-payload/jwt-payload.decorator.js'
import { ConversationsService } from './conversations.service.js'
import { ConversationResponseDto } from './dto/conversation-response.dto.js'
import { ConversationsQueryDto } from './dto/conversations-query.dto.js'
import { ConversationsResponseDto } from './dto/conversations-response.dto.js'
import { CreateConversationRequestDto } from './dto/create-conversation-request.dto.js'
import { CreateConversationResponseDto } from './dto/create-conversation-response.dto.js'
import { UpdateConversationRequestDto } from './dto/update-conversation-request.dto.js'
import { UpdateConversationResponseDto } from './dto/update-conversation-response.dto.js'
import { MessagesQueryDto } from './dto/messages-query.dto.js'
import { MessagesResponseDto } from './dto/messages-response.dto.js'
import { ApiBearerAuth } from '@nestjs/swagger'
import { ChatRequestDto } from './dto/chat-request.dto.js'
import { FeedbackResponseDto } from './dto/feedback-response.dto.js'
import { UpsertFeedbackRequestDto } from './dto/upsert-feedback-request.dto.js'
import { type Response } from 'express'
import { UseRoles } from 'src/role/use-roles.decorator.js'
import { Role } from 'src/generated/prisma/enums.js'
import { Cacheable } from 'src/decorators/cacheable/cacheable.decorator.js'

@UseRoles({ roles: [Role.USER] })
@ApiBearerAuth()
@Controller(CACHE_RESOURCE.conversations)
@Cacheable()
export class ConversationsController {
    constructor(private readonly conversationsService: ConversationsService) {}

    @Post()
    @ZodResponse({ type: CreateConversationResponseDto })
    create(
        @Body() createConversationDto: CreateConversationRequestDto,
        @JwtPayload() { userId }: JwtPayloadDto,
    ): Promise<CreateConversationResponseDto> {
        return this.conversationsService.create(createConversationDto, userId)
    }

    @Get()
    @ZodResponse({ type: ConversationsResponseDto })
    findAll(@Query() query: ConversationsQueryDto, @JwtPayload() { userId }: JwtPayloadDto) {
        return this.conversationsService.findAll({ userId, query })
    }

    @Get(':id/messages')
    @ZodResponse({ type: MessagesResponseDto })
    findAllMessages(
        @Param('id', ParseUUIDPipe) id: string,
        @Query() query: MessagesQueryDto,
        @JwtPayload() { userId }: JwtPayloadDto,
    ) {
        return this.conversationsService.findAllMessages({ id, userId, query })
    }

    @Get(':id')
    @ZodResponse({ type: ConversationResponseDto })
    findOne(@Param('id', ParseUUIDPipe) id: string, @JwtPayload() { userId }: JwtPayloadDto) {
        return this.conversationsService.findOne({ id, userId })
    }

    @Patch(':id')
    @ZodResponse({ type: UpdateConversationResponseDto })
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateConversationDto: UpdateConversationRequestDto,
        @JwtPayload() { userId }: JwtPayloadDto,
    ) {
        return this.conversationsService.update({ id, updateConversationDto, userId })
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string, @JwtPayload() { userId }: JwtPayloadDto) {
        return this.conversationsService.remove({ id, userId })
    }

    @Put(':id/messages/:messageId/feedback')
    @ZodResponse({ type: FeedbackResponseDto })
    upsertFeedback(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('messageId', ParseUUIDPipe) messageId: string,
        @Body() upsertFeedbackDto: UpsertFeedbackRequestDto,
        @JwtPayload() { userId }: JwtPayloadDto,
    ) {
        return this.conversationsService.upsertFeedback({ id, messageId, userId, upsertFeedbackDto })
    }

    @Delete(':id/messages/:messageId/feedback')
    @HttpCode(HttpStatus.NO_CONTENT)
    removeFeedback(
        @Param('id', ParseUUIDPipe) id: string,
        @Param('messageId', ParseUUIDPipe) messageId: string,
        @JwtPayload() { userId }: JwtPayloadDto,
    ) {
        return this.conversationsService.removeFeedback({ id, messageId, userId })
    }

    @Post(':id/chat')
    @Throttle(STRICT_THROTTLE)
    @HttpCode(HttpStatus.OK)
    chat(
        @Param('id', ParseUUIDPipe) id: string,
        @JwtPayload() { userId }: JwtPayloadDto,
        @Body() chatDto: ChatRequestDto,
        @Res() res: Response,
    ) {
        return this.conversationsService.chat({ id, userId, chatDto, res })
    }
}
