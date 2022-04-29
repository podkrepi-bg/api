-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('initial', 'confirmed', 'declined');

-- CreateEnum
CREATE TYPE "report_reason" AS ENUM ('none', 'duplicate', 'inappropriate', 'illegalActivity', 'misinformation', 'privacyViolation', 'spam', 'irrelevant', 'political', 'discrimination', 'explicitContent', 'fraud', 'other');

-- CreateTable
CREATE TABLE "campaign_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "status" "report_status" NOT NULL DEFAULT E'initial',
    "reason" "report_reason" NOT NULL,
    "report_content" TEXT NOT NULL,

    CONSTRAINT "campaign_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "campaign_reports" ADD CONSTRAINT "campaign_reports_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_reports" ADD CONSTRAINT "campaign_reports_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
