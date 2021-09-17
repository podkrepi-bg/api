/*
  Warnings:

  - The values [Initial,Draft,PendingValidation,Approved,Rejected,Active,ActivePendingValidation,Suspended,Complete,Disabled,Error] on the enum `campaign_state` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "campaign_state_new" AS ENUM ('initial', 'draft', 'pendingvalidation', 'approved', 'rejected', 'active', 'activependingvalidation', 'suspended', 'complete', 'disabled', 'error');
ALTER TABLE "campaigns" ALTER COLUMN "state" TYPE "campaign_state_new" USING ("state"::text::"campaign_state_new");
ALTER TYPE "campaign_state" RENAME TO "campaign_state_old";
ALTER TYPE "campaign_state_new" RENAME TO "campaign_state";
DROP TYPE "campaign_state_old";
COMMIT;
