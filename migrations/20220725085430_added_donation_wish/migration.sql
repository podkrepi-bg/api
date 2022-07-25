-- CreateTable
CREATE TABLE "donation_wishes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "message" TEXT NOT NULL,
    "campaign_id" UUID NOT NULL,
    "person_id" UUID,
    "donation_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "donation_wishes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donation_wishes_donation_id_key" ON "donation_wishes"("donation_id");

-- AddForeignKey
ALTER TABLE "donation_wishes" ADD CONSTRAINT "donation_wishes_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donation_wishes" ADD CONSTRAINT "donation_wishes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
