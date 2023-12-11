/*
  Warnings:

  - Made the column `company_id` on table `affiliates` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "affiliates" DROP CONSTRAINT "affiliates_company_id_fkey";

-- AlterTable
ALTER TABLE "affiliates" ALTER COLUMN "company_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
