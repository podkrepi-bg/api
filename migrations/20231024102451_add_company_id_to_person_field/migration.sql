/*
  Warnings:

  - A unique constraint covering the columns `[company_id]` on the table `people` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_person_id_fkey";

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "company_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "people_company_id_key" ON "people"("company_id");

-- AddForeignKey
ALTER TABLE "people" ADD CONSTRAINT "people_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
