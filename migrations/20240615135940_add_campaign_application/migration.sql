-- CreateEnum
CREATE TYPE "CampaignApplicationState" AS ENUM ('review', 'requestInfo', 'forCommitteeReview', 'approved', 'denied', 'abandoned');

-- CreateEnum
CREATE TYPE "CampaignApplicationFileRole" AS ENUM ('document', 'image');

-- CreateTable
CREATE TABLE "campaign_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "organizer_id" UUID NOT NULL,
    "organizer_name" VARCHAR(200) NOT NULL,
    "organizer_email" CITEXT,
    "organizer_phone" VARCHAR(50),
    "beneficiary" VARCHAR(1500) NOT NULL,
    "organizer_beneficiary_relationship" TEXT NOT NULL,
    "campaign_name" VARCHAR(200) NOT NULL,
    "goal" TEXT NOT NULL,
    "history" TEXT,
    "amount" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "campaignGuarantee" VARCHAR(500),
    "otherFinanceSources" TEXT,
    "otherNotes" TEXT,
    "state" "CampaignApplicationState" NOT NULL DEFAULT 'review',
    "category" "campaign_type_category" DEFAULT 'others',
    "ticketURL" VARCHAR(500),
    "archived" BOOLEAN DEFAULT false,

    CONSTRAINT "campaign_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_application_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(200) NOT NULL,
    "campaign_application_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "role" "CampaignApplicationFileRole" NOT NULL,

    CONSTRAINT "campaign_application_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CampaignApplicationToCampaignApplicationFile" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_applications_organizer_email_key" ON "campaign_applications"("organizer_email");

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignApplicationToCampaignApplicationFile_AB_unique" ON "_CampaignApplicationToCampaignApplicationFile"("A", "B");

-- CreateIndex
CREATE INDEX "_CampaignApplicationToCampaignApplicationFile_B_index" ON "_CampaignApplicationToCampaignApplicationFile"("B");

-- AddForeignKey
ALTER TABLE "campaign_applications" ADD CONSTRAINT "campaign_applications_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignApplicationToCampaignApplicationFile" ADD CONSTRAINT "_CampaignApplicationToCampaignApplicationFile_A_fkey" FOREIGN KEY ("A") REFERENCES "campaign_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignApplicationToCampaignApplicationFile" ADD CONSTRAINT "_CampaignApplicationToCampaignApplicationFile_B_fkey" FOREIGN KEY ("B") REFERENCES "campaign_application_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
