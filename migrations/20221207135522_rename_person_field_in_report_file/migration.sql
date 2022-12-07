/*
  Warnings:

  - You are about to drop the column `person_id` on the `campaign_reports_files` table. All the data in the column will be lost.
  - Added the required column `creator_id` to the `campaign_reports_files` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "campaign_reports_files" DROP CONSTRAINT "campaign_reports_files_person_id_fkey";

-- AlterTable
ALTER TABLE "campaign_reports_files" DROP COLUMN "person_id",
ADD COLUMN     "creator_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "campaign_reports_files" ADD CONSTRAINT "campaign_reports_files_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
