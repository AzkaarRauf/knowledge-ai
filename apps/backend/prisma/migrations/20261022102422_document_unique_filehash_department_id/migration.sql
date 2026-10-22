/*
  Warnings:

  - A unique constraint covering the columns `[fileHash,departmentId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Document_fileHash_key";

-- CreateIndex
CREATE UNIQUE INDEX "Document_fileHash_departmentId_key" ON "Document"("fileHash", "departmentId");
