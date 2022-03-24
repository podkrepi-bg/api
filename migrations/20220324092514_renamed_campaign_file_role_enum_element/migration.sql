/*
  Warnings:

  - The values [anyCampaignPicture] on the enum `campaign_file_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "campaign_file_role_new" AS ENUM ('background', 'coordinator', 'campaignPhoto', 'invoice', 'document', 'profilePhoto', 'campaignListPhoto');
ALTER TABLE "campaign_files" ALTER COLUMN "role" TYPE "campaign_file_role_new" USING ("role"::text::"campaign_file_role_new");
ALTER TYPE "campaign_file_role" RENAME TO "campaign_file_role_old";
ALTER TYPE "campaign_file_role_new" RENAME TO "campaign_file_role";
DROP TYPE "campaign_file_role_old";
COMMIT;
