-- CreateTable
CREATE TABLE "campaign_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(200) NOT NULL,
    "campaign_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,

    CONSTRAINT "campaign_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "campaign_files" ADD CONSTRAINT "campaign_files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_files" ADD CONSTRAINT "campaign_files_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
