-- CreateEnum
CREATE TYPE "campaign_type_category" AS ENUM ('medical', 'charity', 'disasters', 'education', 'events', 'environment', 'sport', 'art', 'nature', 'animals', 'others');

-- AlterTable
ALTER TABLE "campaign_types" ADD COLUMN     "category" "campaign_type_category" NOT NULL DEFAULT E'others';
