/*
  Warnings:

  - A unique constraint covering the columns `[person_id]` on the table `coordinators` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `role` on the `campaign_files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "role" AS ENUM ('background', 'coordinator', 'campaignPhoto', 'invoice', 'document');

-- CreateEnum
CREATE TYPE "CampaignFileType" AS ENUM ('png', 'jpeg', 'pdf', 'docx');

-- AlterTable
ALTER TABLE "campaign_files" DROP COLUMN "role",
ADD COLUMN     "role" "role" NOT NULL;
