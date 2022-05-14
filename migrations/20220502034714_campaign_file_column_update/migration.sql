-- DropForeignKey
ALTER TABLE "campaign_files" DROP CONSTRAINT "campaign_files_uploaded_by_id_fkey";

-- AlterTable
ALTER TABLE "campaign_files" RENAME COLUMN "uploaded_by_id" TO "person_id";

-- AddForeignKey
ALTER TABLE "campaign_files" ADD CONSTRAINT "campaign_files_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
