import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from 'src/prisma/prisma.service.js'
import { S3Service } from 'src/s3/s3.service.js'
import { DocumentsService } from './documents.service.js'

describe('DocumentsService', () => {
    let service: DocumentsService

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DocumentsService, { provide: PrismaService, useValue: {} }, { provide: S3Service, useValue: {} }],
        }).compile()

        service = module.get<DocumentsService>(DocumentsService)
    })

    it('should be defined', () => {
        expect(service).toBeDefined()
    })
})
