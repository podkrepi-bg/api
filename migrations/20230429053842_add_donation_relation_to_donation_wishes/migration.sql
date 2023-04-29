-- AddForeignKey
ALTER TABLE "donation_wishes" ADD CONSTRAINT "donation_wishes_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
