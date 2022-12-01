/*
  Warnings:

  - Added the required column `is_deleted` to the `campaign_reports_files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaign_reports_files" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL;
