/*
  Warnings:

  - Added the required column `role` to the `campaign_files` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "campaign_file_role" AS ENUM ('background', 'coordinator', 'campaignPhoto', 'invoice', 'document');

-- AlterTable
ALTER TABLE "campaign_files" ADD COLUMN     "mimetype" VARCHAR(50),
ADD COLUMN     "role" "campaign_file_role" NOT NULL;
