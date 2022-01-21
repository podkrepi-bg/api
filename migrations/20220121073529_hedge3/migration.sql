/*
  Warnings:

  - You are about to drop the column `company` on the `Hedgehog` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Hedgehog` table. All the data in the column will be lost.
  - You are about to drop the column `email_confirmed` on the `Hedgehog` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Hedgehog` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Hedgehog_email_key";

-- AlterTable
ALTER TABLE "Hedgehog" DROP COLUMN "company",
DROP COLUMN "email",
DROP COLUMN "email_confirmed",
DROP COLUMN "phone";
