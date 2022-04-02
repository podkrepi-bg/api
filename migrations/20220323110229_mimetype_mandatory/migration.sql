/*
  Warnings:

  - Made the column `mimetype` on table `campaign_files` required. This step will fail if there are existing NULL values in that column.

*/
-- Update any existing rows with a mimetype to octet-stream (meaning we don't know the type).
UPDATE "campaign_files" SET "mimetype" = 'application/octet-stream' WHERE "mimetype" IS NULL;

-- AlterTable
ALTER TABLE "campaign_files" ALTER COLUMN "mimetype" SET NOT NULL;
