-- CreateTable
CREATE TABLE "bank_donation_references" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "amount" INTEGER NOT NULL DEFAULT 0,
    "campaign_id" UUID NOT NULL,
    "billing_name" TEXT NOT NULL,
    "billing_email" TEXT NOT NULL,

    CONSTRAINT "bank_donation_references_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bank_donation_references" ADD CONSTRAINT "bank_donation_references_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
