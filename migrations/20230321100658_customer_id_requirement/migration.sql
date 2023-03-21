/*
  Warnings:

  - Made the column `ext_customer_id` on table `recurring_donations` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "recurring_donations" ALTER COLUMN "ext_customer_id" SET NOT NULL;
