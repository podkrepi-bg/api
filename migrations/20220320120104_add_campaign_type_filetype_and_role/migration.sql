/*
  Warnings:

  - Added the required column `role` to the `campaign_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `campaign_files` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "campaign_file_role" AS ENUM ('background', 'coordinator', 'campaignPhoto', 'invoice', 'document');

-- CreateEnum
CREATE TYPE "campaign_file_type" AS ENUM ('png', 'jpeg', 'pdf', 'docx');

-- AlterTable
ALTER TABLE "campaign_files" ADD COLUMN     "role" "campaign_file_role" NOT NULL,
ADD COLUMN     "type" "campaign_file_type" NOT NULL;
