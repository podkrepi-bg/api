/*
  Warnings:

  - Added the required column `category` to the `campaign_types` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "campaign_type_category" AS ENUM ('medical', 'charity', 'disasters', 'education', 'events', 'environment', 'sport', 'art', 'nature', 'animals', 'others');

-- AlterTable
ALTER TABLE "campaign_types" ADD COLUMN     "category" "campaign_type_category" NOT NULL;
