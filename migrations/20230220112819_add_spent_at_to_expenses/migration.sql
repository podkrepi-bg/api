-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "spent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;