/*
The below migration is written by hand because the default migration drops and recreates tables
*/
-- RenameEnum
ALTER TYPE "report_status" RENAME TO "irregularity_status";

-- CreateEnum
CREATE TYPE "irregularity_reason" AS ENUM ('duplicate', 'inappropriate', 'illegalActivity', 'misinformation', 'privacyViolation', 'spam', 'irrelevant', 'political', 'discrimination', 'explicitContent', 'fraud', 'other');

-- DropForeignKey
ALTER TABLE "campaign_reports" DROP CONSTRAINT "campaign_reports_campaign_id_fkey";

-- DropForeignKey
ALTER TABLE "campaign_reports" DROP CONSTRAINT "campaign_reports_person_id_fkey";

-- DropForeignKey
ALTER TABLE "report_files" DROP CONSTRAINT "report_files_campaign_report_id_fkey";

-- DropForeignKey
ALTER TABLE "report_files" DROP CONSTRAINT "report_files_uploaded_by_id_fkey";

-- RenameTable
ALTER TABLE "campaign_reports" RENAME TO "irregularities";

-- AlterColumnTypes
ALTER TABLE "irregularities" 
    ALTER COLUMN "reason" TYPE varchar(255);

ALTER TABLE "irregularities" 
    ALTER COLUMN "reason" TYPE "irregularity_reason" USING reason::irregularity_reason;

ALTER TABLE "irregularities" 
    ALTER COLUMN "reason" SET DEFAULT E'other';

-- DropEnum
DROP TYPE "report_reason";

-- RenameColumns
ALTER TABLE "irregularities"
    RENAME COLUMN "report_content" TO "description";

-- RenamePrimaryKey
ALTER INDEX "campaign_reports_pkey" RENAME TO "irregularities_pkey";

-- AddForeignKey
ALTER TABLE "irregularities" ADD CONSTRAINT "irregularities_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irregularities" ADD CONSTRAINT "irregularities_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameTable
ALTER TABLE "report_files" RENAME TO "irregularity_files";

-- CreateTable
ALTER TABLE "irregularity_files"
    RENAME COLUMN "campaign_report_id" TO "irregularity_id";
ALTER TABLE "irregularity_files"
    RENAME COLUMN "uploaded_by_id" TO "uploader_id";

-- RenamePrimaryKey
ALTER INDEX "report_files_pkey" RENAME TO "irregularity_files_pkey";

-- AddForeignKey
ALTER TABLE "irregularity_files" ADD CONSTRAINT "irregularity_files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "irregularity_files" ADD CONSTRAINT "irregularity_files_irregularity_id_fkey" FOREIGN KEY ("irregularity_id") REFERENCES "irregularities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
