/*
  Warnings:

  - You are about to drop the column `coordinator_relation` on the `beneficiaries` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_city_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_company_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_coordinator_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_person_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_beneficiary_id_fkey";

-- AlterTable
ALTER TABLE "beneficiaries" DROP COLUMN "coordinator_relation",
ALTER COLUMN "person_id" SET DATA TYPE TEXT,
ALTER COLUMN "coordinator_id" SET DATA TYPE TEXT,
ALTER COLUMN "company_id" SET DATA TYPE TEXT;
