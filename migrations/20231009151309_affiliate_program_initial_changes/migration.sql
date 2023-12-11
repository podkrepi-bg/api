/*
  Warnings:

  - You are about to drop the column `personId` on the `companies` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `people` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[person_id]` on the table `companies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('active', 'pending', 'cancelled', 'rejected');

-- DropForeignKey
ALTER TABLE "companies" DROP CONSTRAINT "companies_personId_fkey";

-- DropIndex
DROP INDEX "companies_personId_key";

-- AlterTable
ALTER TABLE "companies" DROP COLUMN "personId",
ADD COLUMN     "person_id" UUID;

-- AlterTable
ALTER TABLE "people" DROP COLUMN "company";

-- CreateTable
CREATE TABLE "affiliates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" "AffiliateStatus" NOT NULL DEFAULT 'pending',
    "affiliate_code" TEXT,
    "company_id" UUID,

    CONSTRAINT "affiliates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_affiliate_code_key" ON "affiliates"("affiliate_code");

-- CreateIndex
CREATE UNIQUE INDEX "affiliates_company_id_key" ON "affiliates"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_person_id_key" ON "companies"("person_id");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affiliates" ADD CONSTRAINT "affiliates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
