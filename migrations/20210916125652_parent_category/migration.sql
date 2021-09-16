-- AlterTable
ALTER TABLE "campaign_types" ADD COLUMN     "parent_id" UUID;

-- AddForeignKey
ALTER TABLE "campaign_types" ADD CONSTRAINT "campaign_types_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "campaign_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
