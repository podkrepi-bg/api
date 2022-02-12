-- DropForeignKey
ALTER TABLE "campaign_types" DROP CONSTRAINT "campaign_types_parent_id_fkey";

-- AlterTable
ALTER TABLE "campaign_types" ALTER COLUMN "parent_id" SET DATA TYPE TEXT;