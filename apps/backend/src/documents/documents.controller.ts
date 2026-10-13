import {
    Body,
    Controller,
    Delete,
    FileTypeValidator,
    Get,
    HttpStatus,
    MaxFileSizeValidator,
    Param,
    ParseFilePipe,
    Patch,
    Post,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { DocumentsService } from './documents.service.js'
import { CreateDocumentDto } from './dto/create-document.dto.js'
import { UpdateDocumentDto } from './dto/update-document.dto.js'
import { UploadDocumentDto } from './dto/upload-document.dto.js'
import { JwtPayload } from 'src/decorators/jwt-payload/jwt-payload.decorator.js'
import { JwtPayloadDto } from 'src/common/dtos/jwt-payload.dto.js'
import { ZodResponse } from 'nestjs-zod'
import { type Response } from 'express'

@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
    constructor(private readonly documentsService: DocumentsService) {}

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadDocumentDto })
    async upload(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }), // 25mb
                    new FileTypeValidator({
                        // pdf, plain text, docx
                        fileType:
                            /^(application\/pdf|text\/plain|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
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

    @Post()
    create(@Body() createDocumentDto: CreateDocumentDto) {
        return this.documentsService.create(createDocumentDto)
    }

    @Get()
    findAll() {
        return this.documentsService.findAll()
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.documentsService.findOne(+id)
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
        return this.documentsService.update(+id, updateDocumentDto)
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.documentsService.remove(+id)
    }
}
