/*
  Warnings:

  - A unique constraint covering the columns `[personId]` on the table `companies` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "personId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "companies_personId_key" ON "companies"("personId");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
