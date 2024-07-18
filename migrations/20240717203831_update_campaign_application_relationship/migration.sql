/*
  Warnings:

  - You are about to drop the `_CampaignApplicationToCampaignApplicationFile` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_CampaignApplicationToCampaignApplicationFile" DROP CONSTRAINT "_CampaignApplicationToCampaignApplicationFile_A_fkey";

-- DropForeignKey
ALTER TABLE "_CampaignApplicationToCampaignApplicationFile" DROP CONSTRAINT "_CampaignApplicationToCampaignApplicationFile_B_fkey";

-- DropTable
DROP TABLE "_CampaignApplicationToCampaignApplicationFile";

-- AddForeignKey
ALTER TABLE "campaign_application_files" ADD CONSTRAINT "campaign_application_files_campaign_application_id_fkey" FOREIGN KEY ("campaign_application_id") REFERENCES "campaign_applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
