/*
  Renaming bank_hash to payment_reference to better describe it's purpose
  Adding unique index to protect from duplicates
*/
-- AlterTable
ALTER TABLE "campaigns"
  RENAME COLUMN  "bank_hash" TO "payment_reference";

ALTER TABLE "campaigns" 
  ALTER COLUMN "payment_reference" TYPE varchar(15);

CREATE UNIQUE INDEX "campaigns_payment_reference_key" ON "campaigns"("payment_reference");

