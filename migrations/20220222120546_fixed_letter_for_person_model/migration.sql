/*
  Warnings:

  - The `person_id` column on the `beneficiaries` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `company_id` column on the `beneficiaries` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parent_id` column on the `campaign_types` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `coordinator_id` on the `beneficiaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `city_id` on the `beneficiaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `beneficiaries` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `status` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_document_id_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_vault_id_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_source_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_source_vault_id_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_target_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "transfers" DROP CONSTRAINT "transfers_target_vault_id_fkey";

-- DropForeignKey
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_campaign_id_fkey";

-- AlterTable
ALTER TABLE "beneficiaries" DROP COLUMN "person_id",
ADD COLUMN     "person_id" UUID,
DROP COLUMN "coordinator_id",
ADD COLUMN     "coordinator_id" UUID NOT NULL,
ALTER COLUMN "country_code" SET DATA TYPE CITEXT,
DROP COLUMN "city_id",
ADD COLUMN     "city_id" UUID NOT NULL,
DROP COLUMN "company_id",
ADD COLUMN     "company_id" UUID,
DROP COLUMN "type",
ADD COLUMN     "type" "beneficiary_type" NOT NULL;

-- AlterTable
ALTER TABLE "campaign_types" DROP COLUMN "parent_id",
ADD COLUMN     "parent_id" UUID;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "status" "ExpenseStatus" NOT NULL;

-- AddForeignKey
ALTER TABLE "coordinators" ADD CONSTRAINT "coordinators_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefactors" ADD CONSTRAINT "benefactors_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_types" ADD CONSTRAINT "campaign_types_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "campaign_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "info_requests" ADD CONSTRAINT "info_requests_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supporters" ADD CONSTRAINT "supporters_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recurring_donations" ADD CONSTRAINT "recurring_donations_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_source_vault_id_fkey" FOREIGN KEY ("source_vault_id") REFERENCES "vaults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_source_campaign_id_fkey" FOREIGN KEY ("source_campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_target_vault_id_fkey" FOREIGN KEY ("target_vault_id") REFERENCES "vaults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_target_campaign_id_fkey" FOREIGN KEY ("target_campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "vaults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
