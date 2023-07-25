-- CreateTable
CREATE TABLE "notification_list" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "name" TEXT,

    CONSTRAINT "notification_list_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notification_list" ADD CONSTRAINT "notification_list_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
