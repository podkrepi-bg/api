/*
  Warnings:

  - You are about to drop the column `category` on the `campaign_applications` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "campaign_applications" DROP COLUMN "category",
ADD COLUMN     "campaignTypeId" UUID;
