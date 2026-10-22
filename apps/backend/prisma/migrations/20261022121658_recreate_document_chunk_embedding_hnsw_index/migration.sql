-- manually recreate HNSW vector index (20261022121540 dropped it, prisma schema can't express it).
-- apply with `prisma migrate deploy`, not `migrate dev`, or migrate dev drops it again.
-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_idx" ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);
