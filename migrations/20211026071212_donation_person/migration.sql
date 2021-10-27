-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "person_id" UUID;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
