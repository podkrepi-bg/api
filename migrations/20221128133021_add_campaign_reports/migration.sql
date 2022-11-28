-- CreateEnum
CREATE TYPE "campaign_report_file_type" AS ENUM ('photo', 'document');

-- CreateTable
CREATE TABLE "campaign_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "total_funds" DOUBLE PRECISION,
    "funds_for_period" DOUBLE PRECISION,
    "spent_funds_for_period" DOUBLE PRECISION,
    "goals" TEXT NOT NULL,
    "next_steps" TEXT NOT NULL,
    "additional_info" TEXT NOT NULL,

    CONSTRAINT "campaign_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_reports_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "report_id" UUID NOT NULL,
    "filename" VARCHAR(200) NOT NULL,
    "mimetype" VARCHAR(50) NOT NULL,
    "type" "campaign_report_file_type" NOT NULL,
    "person_id" UUID NOT NULL,

    CONSTRAINT "campaign_reports_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_reports" ADD CONSTRAINT "campaign_reports_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_reports_files" ADD CONSTRAINT "campaign_reports_files_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "campaign_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_reports_files" ADD CONSTRAINT "campaign_reports_files_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
