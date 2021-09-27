-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN     "approved_by_id" UUID;

-- AlterTable
ALTER TABLE "transfers" ADD COLUMN     "approved_by_id" UUID;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
