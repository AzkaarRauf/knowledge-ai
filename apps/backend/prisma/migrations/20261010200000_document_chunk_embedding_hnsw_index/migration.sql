-- manually add HNSW vector index (prisma schema can't express pgvector index types)
-- CreateIndex
CREATE INDEX "DocumentChunk_embedding_idx" ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);
