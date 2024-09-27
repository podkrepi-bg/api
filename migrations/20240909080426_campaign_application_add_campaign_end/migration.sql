-- AlterTable
ALTER TABLE "campaign_applications" ADD COLUMN     "campaignEnd" TEXT DEFAULT 'funds',
ADD COLUMN     "campaignEndDate" TIMESTAMPTZ(6);
