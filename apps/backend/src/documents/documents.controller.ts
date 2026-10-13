import {
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    HttpCode,
    HttpStatus,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    ParseUUIDPipe,
    Post,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse } from '@nestjs/swagger'
import { DocumentsService } from './documents.service.js'
import { UploadDocumentDto } from './dto/upload-document.dto.js'
import { DocumentResponseDto } from './dto/document-response.dto.js'
import { JwtPayload } from 'src/decorators/jwt-payload/jwt-payload.decorator.js'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { ZodResponse } from 'nestjs-zod'
import { type Response } from 'express'
import { DOCUMENT_MAX_SIZE, DOCUMENT_MIME_TYPES } from 'shared'

@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadDocumentDto })
    @ZodResponse({ type: DocumentResponseDto, status: 201, description: 'Document uploaded' })
    @ApiOkResponse({ type: DocumentResponseDto, description: 'Same file already uploaded' })
    async upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: DOCUMENT_MAX_SIZE }),
                    new FileTypeValidator({
                        fileType: new RegExp(
                            `^(${DOCUMENT_MIME_TYPES.map((t) => t.replaceAll('.', '\\.')).join('|')})$`,
                        ),
                        // txt has no magic number, so fall back to the client mimetype
                        fallbackToMimetype: true,
                        errorMessage: 'Allowed file formats: PDF, DOCX, TEXT',
                    }),
                ],
            }),
        )
        file: Express.Multer.File,
        @JwtPayload() { userId }: JwtPayloadDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const { document, isNew } = await this.documentsService.upload({ file, userId })
        if (!isNew) res.status(HttpStatus.OK)
        return document
    }

    @Get()
    @ZodResponse({ type: [DocumentResponseDto], status: 200 })
    findAll(@JwtPayload() { userId }: JwtPayloadDto) {
        return this.documentsService.findAll(userId)
    }

    @Get(':id')
    @ZodResponse({ type: DocumentResponseDto, status: 200 })
    findOne(@Param('id', ParseUUIDPipe) id: string, @JwtPayload() { userId }: JwtPayloadDto) {
        return this.documentsService.findOne(id, userId)
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    remove(@Param('id', ParseUUIDPipe) id: string, @JwtPayload() { userId }: JwtPayloadDto) {
        return this.documentsService.remove(id, userId)
    }
}
