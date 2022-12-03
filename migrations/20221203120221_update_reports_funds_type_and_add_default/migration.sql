/*
  Warnings:

  - You are about to alter the column `total_funds` on the `campaign_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `funds_for_period` on the `campaign_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `spent_funds_for_period` on the `campaign_reports` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "campaign_reports" ALTER COLUMN "total_funds" SET DEFAULT 0,
ALTER COLUMN "total_funds" SET DATA TYPE INTEGER,
ALTER COLUMN "funds_for_period" SET DEFAULT 0,
ALTER COLUMN "funds_for_period" SET DATA TYPE INTEGER,
ALTER COLUMN "spent_funds_for_period" SET DEFAULT 0,
ALTER COLUMN "spent_funds_for_period" SET DATA TYPE INTEGER;
