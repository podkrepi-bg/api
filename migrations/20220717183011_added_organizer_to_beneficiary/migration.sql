-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_coordinator_id_fkey";

-- AlterTable
ALTER TABLE "beneficiaries" ADD COLUMN     "organizer_id" UUID,
ADD COLUMN     "organizer_relation" "person_relation" DEFAULT E'none',
ALTER COLUMN "coordinator_id" DROP NOT NULL,
ALTER COLUMN "coordinator_relation" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
