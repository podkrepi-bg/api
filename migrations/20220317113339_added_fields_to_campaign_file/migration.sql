/*
  Warnings:

  - Added the required column `role` to the `campaign_files` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `campaign_files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "campaign_files" ADD COLUMN     "role" VARCHAR(200) NOT NULL,
ADD COLUMN     "type" VARCHAR(200) NOT NULL;
