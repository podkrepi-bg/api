/*
  Warnings:

  - Made the column `email` on table `people` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "people" ALTER COLUMN "email" SET NOT NULL;
