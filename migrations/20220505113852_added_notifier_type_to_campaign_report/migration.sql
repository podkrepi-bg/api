/*
  Warnings:

  - Added the required column `notifierType` to the `campaign_reports` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "notifier_type" AS ENUM ('benefactor', 'other');

-- AlterTable
ALTER TABLE "campaign_reports" ADD COLUMN     "notifierType" "notifier_type" NOT NULL;
