/*
  Warnings:

  - Added the required column `metadata` to the `DocumentChunk` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DocumentChunk_embedding_idx";

-- AlterTable
ALTER TABLE "DocumentChunk" ADD COLUMN     "metadata" JSONB NOT NULL;
