/*
  Warnings:

  - You are about to drop the column `campaign_id` on the `report_files` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "report_files" DROP CONSTRAINT "report_files_campaign_id_fkey";

-- AlterTable
ALTER TABLE "report_files" DROP COLUMN "campaign_id";
