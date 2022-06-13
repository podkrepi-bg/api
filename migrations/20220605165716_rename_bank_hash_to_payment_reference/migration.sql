/*
  Renaming bank_hash to payment_reference to better describe it's purpose
  Adding unique index to protect from duplicates
*/
-- AlterTable
ALTER TABLE "campaigns"
  RENAME COLUMN  "bank_hash" TO "payment_reference";

ALTER TABLE "campaigns" 
  ALTER COLUMN "payment_reference" TYPE varchar(15);

-- make sure all payment-refs are unique taking the middle part of the guid id example: '4052-4A03-9B4C'
UPDATE "campaigns" SET "payment_reference" = upper(substr(id::text, 10, 14))
WHERE ("payment_reference" IS NULL OR trim("payment_reference") != '' OR length("payment_reference") < 14);

CREATE UNIQUE INDEX "campaigns_payment_reference_key" ON "campaigns"("payment_reference");

