-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "campaign_state" ADD VALUE 'partially_financed';
ALTER TYPE "campaign_state" ADD VALUE 'paused';
ALTER TYPE "campaign_state" ADD VALUE 'suspended';
ALTER TYPE "campaign_state" ADD VALUE 'blocked';
ALTER TYPE "campaign_state" ADD VALUE 'deleted';
