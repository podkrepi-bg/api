/*
  Warnings:

  - You are about to drop the column `support_data` on the `support_requests` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "support_requests" DROP COLUMN "support_data",
ADD COLUMN     "association_member" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "benefactor_campaign" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "benefactor_platform" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "company_other_text" TEXT,
ADD COLUMN     "company_sponsor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "company_volunteer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partner_bussiness" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partner_npo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "partner_other_text" TEXT,
ADD COLUMN     "role_association_member" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role_benefactor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role_company" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role_partner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role_volunteer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_backend" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_designer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_dev_ops" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_finances_and_accounts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_frontend" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_lawyer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_marketing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_project_manager" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_qa" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "volunteer_security" BOOLEAN NOT NULL DEFAULT false;
