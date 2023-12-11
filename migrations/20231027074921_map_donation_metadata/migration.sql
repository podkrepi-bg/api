/*
  Warnings:

  - You are about to drop the `DonationMetadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DonationMetadata" DROP CONSTRAINT "DonationMetadata_donation_id_fkey";

-- DropTable
DROP TABLE "DonationMetadata";

-- CreateTable
CREATE TABLE "donation_metadata" (
    "donation_id" UUID NOT NULL,
    "name" VARCHAR,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extra_data" JSONB,

    CONSTRAINT "donation_metadata_pkey" PRIMARY KEY ("donation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "donation_metadata_donation_id_key" ON "donation_metadata"("donation_id");

-- AddForeignKey
ALTER TABLE "donation_metadata" ADD CONSTRAINT "donation_metadata_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
