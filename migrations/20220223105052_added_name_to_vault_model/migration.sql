/*
  Warnings:

  - Added the required column `name` to the `vaults` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "vaults" ADD COLUMN     "name" VARCHAR(100) NOT NULL DEFAULT E'';

-- AlterTable
ALTER TABLE "cities" ALTER COLUMN "postal_code" SET DATA TYPE TEXT;
