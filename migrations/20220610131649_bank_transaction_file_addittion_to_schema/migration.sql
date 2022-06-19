/*
  Warnings:

  - Added the required column `person_id` to the `bank_transactions_files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bank_transactions_files" ADD COLUMN     "person_id" UUID NOT NULL;
