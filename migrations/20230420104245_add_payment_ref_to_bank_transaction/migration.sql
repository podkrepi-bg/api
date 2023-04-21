-- AlterEnum
ALTER TYPE "bank_donation_status" ADD VALUE 're_imported';

-- AlterTable
ALTER TABLE "bank_transactions" ADD COLUMN     "matched_ref" VARCHAR(100);
