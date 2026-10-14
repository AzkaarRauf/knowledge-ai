import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common'
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

@Controller('conversations')
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
}
