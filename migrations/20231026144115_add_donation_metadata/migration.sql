-- CreateTable
CREATE TABLE "DonationMetadata" (
    "donation_id" UUID NOT NULL,
    "name" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extra_data" JSONB,

    CONSTRAINT "DonationMetadata_pkey" PRIMARY KEY ("donation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DonationMetadata_donation_id_key" ON "DonationMetadata"("donation_id");

-- AddForeignKey
ALTER TABLE "DonationMetadata" ADD CONSTRAINT "DonationMetadata_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
