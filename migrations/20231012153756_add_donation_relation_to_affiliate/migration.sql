-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "affiliate_id" UUID;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
