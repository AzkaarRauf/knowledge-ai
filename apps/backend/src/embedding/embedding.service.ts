import { Document } from '@langchain/core/documents'
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai'
import { Injectable } from '@nestjs/common'

@Injectable()
export class EmbeddingService {
    private readonly model = 'gemini-embedding-2'
    private readonly outputDimensionality = 768
    private readonly embeddings = new GoogleGenerativeAIEmbeddings({
        model: this.model,
        outputDimensionality: this.outputDimensionality,
    })

    async embedDocuments(docs: Document[]) {
        const embeds = await this.embeddings.embedDocuments(docs.map((item) => item.pageContent))
        return embeds
    }

    async embedQuery(query: string) {
        const embeds = await this.embeddings.embedQuery(query)
        return embeds
    }
}
