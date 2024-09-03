/*
  Warnings:

  - The values [initial,pending_validation,approved,rejected,active_pending_validation,disabled,error] on the enum `campaign_state` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "campaign_state_new" AS ENUM ('draft', 'active', 'complete', 'partially_financed', 'paused', 'suspended', 'blocked', 'deleted');
ALTER TABLE "campaigns" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "campaigns" ALTER COLUMN "state" TYPE "campaign_state_new" USING ("state"::text::"campaign_state_new");
ALTER TYPE "campaign_state" RENAME TO "campaign_state_old";
ALTER TYPE "campaign_state_new" RENAME TO "campaign_state";
DROP TYPE "campaign_state_old";
ALTER TABLE "campaigns" ALTER COLUMN "state" SET DEFAULT 'draft';
COMMIT;
