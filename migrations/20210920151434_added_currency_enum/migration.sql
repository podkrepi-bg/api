/*
  Warnings:

  - The `currency` column on the `campaigns` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BGN', 'EUR', 'USD');

-- AlterTable
ALTER TABLE "beneficiaries" ALTER COLUMN "description" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "reached_amount" DECIMAL DEFAULT 0,
ALTER COLUMN "target_amount" SET DEFAULT 0,
DROP COLUMN "currency",
ADD COLUMN     "currency" "Currency" DEFAULT E'BGN';
