-- rename column and its index, keeps existing data
ALTER TABLE "DocumentChunk" RENAME COLUMN "tsv" TO "contentSearch";

ALTER INDEX "DocumentChunk_tsv_idx" RENAME TO "DocumentChunk_contentSearch_idx";
