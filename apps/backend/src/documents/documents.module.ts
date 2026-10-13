import { Module } from '@nestjs/common'
import { DocumentsService } from './documents.service.js'
import { DocumentsController } from './documents.controller.js'
import { S3Module } from 'src/s3/s3.module.js'

@Module({
    controllers: [DocumentsController],
    providers: [DocumentsService],
    imports: [S3Module],
})
export class DocumentsModule {}
