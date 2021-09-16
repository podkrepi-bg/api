/*
  Warnings:

  - The values [Individual,Organisation] on the enum `beneficiary_type` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[postal_code]` on the table `cities` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "person_relation" AS ENUM ('none', 'parent', 'spouse', 'child', 'mother', 'father', 'brother', 'sister', 'friend', 'relative', 'partner', 'domesticPartner', 'manager', 'assistant', 'colleague');

-- AlterEnum
BEGIN;
CREATE TYPE "beneficiary_type_new" AS ENUM ('individual', 'organisation');
ALTER TABLE "beneficiaries" ALTER COLUMN "type" TYPE "beneficiary_type_new" USING ("type"::text::"beneficiary_type_new");
ALTER TYPE "beneficiary_type" RENAME TO "beneficiary_type_old";
ALTER TYPE "beneficiary_type_new" RENAME TO "beneficiary_type";
DROP TYPE "beneficiary_type_old";
COMMIT;

-- AlterTable
ALTER TABLE "beneficiaries" ADD COLUMN     "coordinator_relation" "person_relation" NOT NULL DEFAULT E'none';

-- AlterTable
ALTER TABLE "people" ADD COLUMN     "address" VARCHAR(50),
ADD COLUMN     "birthday" TIMESTAMPTZ(6);

-- CreateIndex
CREATE UNIQUE INDEX "cities_postal_code_key" ON "cities"("postal_code");
