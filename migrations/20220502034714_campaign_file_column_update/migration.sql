/*
  Warnings:

  - You are about to drop the column `uploaded_by_id` on the `campaign_files` table. All the data in the column will be lost.
  - Added the required column `person_id` to the `campaign_files` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "campaign_files" DROP CONSTRAINT "campaign_files_uploaded_by_id_fkey";

-- AlterTable
ALTER TABLE "campaign_files" DROP COLUMN "uploaded_by_id",
ADD COLUMN     "person_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "campaign_files" ADD CONSTRAINT "campaign_files_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
