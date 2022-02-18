/*
  Warnings:

  - You are about to drop the column `status` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `people` table. All the data in the column will be lost.
  - Changed the type of `type` on the `beneficiaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "benefactors" DROP CONSTRAINT "benefactors_person_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_city_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_company_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_coordinator_id_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_person_id_fkey";

-- DropForeignKey
ALTER TABLE "campaign_types" DROP CONSTRAINT "campaign_types_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "campaigns" DROP CONSTRAINT "campaigns_coordinator_id_fkey";

-- DropForeignKey
ALTER TABLE "coordinators" DROP CONSTRAINT "coordinators_person_id_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "info_requests" DROP CONSTRAINT "info_requests_person_id_fkey";

-- DropForeignKey
ALTER TABLE "recurring_donations" DROP CONSTRAINT "recurring_donations_person_id_fkey";

-- DropForeignKey
ALTER TABLE "supporters" DROP CONSTRAINT "supporters_person_id_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_approved_by_id_fkey";

-- DropForeignKey
ALTER TABLE "withdrawals" DROP CONSTRAINT "withdrawals_approved_by_id_fkey";

-- AlterTable
ALTER TABLE "beneficiaries" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "person_id" SET DATA TYPE TEXT,
ALTER COLUMN "coordinator_id" SET DATA TYPE TEXT,
ALTER COLUMN "country_code" SET DATA TYPE TEXT,
ALTER COLUMN "city_id" SET DATA TYPE TEXT,
ALTER COLUMN "company_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "campaign_types" ALTER COLUMN "parent_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "people" DROP COLUMN "address",
ADD COLUMN     "adress" VARCHAR(100);