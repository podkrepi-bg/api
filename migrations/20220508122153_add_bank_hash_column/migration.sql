-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "bank_hash" VARCHAR(5) NULL;
UPDATE "campaigns" SET "bank_hash" = 'ABCDE';
ALTER TABLE "campaigns" ALTER COLUMN "bank_hash" SET NOT NULL;
