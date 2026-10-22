-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "tsv" tsvector;

-- fill tsv for chunks that already exist
UPDATE "DocumentChunk" SET "tsv" = to_tsvector('english', "content");

-- CreateIndex
CREATE INDEX "DocumentChunk_tsv_idx" ON "DocumentChunk" USING GIN ("tsv");

-- manually recreate HNSW vector index (20261013053805_metadata_to_documentchunk dropped it by mistake).
-- prisma schema can't express it, so future migrations will try to drop it. the pre-commit hook blocks that.
-- CreateIndex
CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_idx" ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);
