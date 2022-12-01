/*
  Warnings:

  - Added the required column `creator_id` to the `campaign_reports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaign_reports" ADD COLUMN     "creator_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "campaign_reports" ADD CONSTRAINT "campaign_reports_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
