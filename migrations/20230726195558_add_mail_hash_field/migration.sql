/*
  Warnings:

  - Added the required column `mailHash` to the `unregistered_notification_consent` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "people" ADD COLUMN     "mailHash" TEXT;

-- AlterTable
ALTER TABLE "unregistered_notification_consent" ADD COLUMN     "mailHash" TEXT NOT NULL;
