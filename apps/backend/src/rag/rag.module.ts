import { Module } from '@nestjs/common'
import { RAGService } from './rag.service.js'
import { EmbeddingModule } from 'src/embedding/embedding.module.js'

@Module({
    providers: [RAGService],
    imports: [EmbeddingModule],
    exports: [RAGService],
})
export class RAGModule {}
