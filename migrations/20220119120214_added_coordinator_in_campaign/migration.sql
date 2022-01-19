-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
