-- CreateEnum
CREATE TYPE "notifier_type" AS ENUM ('benefactor', 'other');

-- AlterTable
ALTER TABLE "campaign_reports" ADD COLUMN     "notifierType" "notifier_type" NOT NULL DEFAULT E'other';

-- CreateTable
CREATE TABLE "report_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(200) NOT NULL,
    "mimetype" VARCHAR(50) NOT NULL,
    "campaign_report_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,

    CONSTRAINT "report_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "report_files" ADD CONSTRAINT "report_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_files" ADD CONSTRAINT "report_files_campaign_report_id_fkey" FOREIGN KEY ("campaign_report_id") REFERENCES "campaign_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
