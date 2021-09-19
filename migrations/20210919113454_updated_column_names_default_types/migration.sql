/*
  Warnings:

  - The values [pendingvalidation,activependingvalidation] on the enum `campaign_state` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `name` on the `cities` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the column `countryCode` on the `countries` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `countries` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the `contact_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `support_requests` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[country_code]` on the table `countries` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `coordinator_id` to the `beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `person_id` to the `beneficiaries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country_code` to the `countries` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_name` to the `people` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "campaign_state_new" AS ENUM ('initial', 'draft', 'pending_validation', 'approved', 'rejected', 'active', 'active_pending_validation', 'suspended', 'complete', 'disabled', 'error', 'deleted');
ALTER TABLE "campaigns" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "campaigns" ALTER COLUMN "state" TYPE "campaign_state_new" USING ("state"::text::"campaign_state_new");
ALTER TYPE "campaign_state" RENAME TO "campaign_state_old";
ALTER TYPE "campaign_state_new" RENAME TO "campaign_state";
DROP TYPE "campaign_state_old";
ALTER TABLE "campaigns" ALTER COLUMN "state" SET DEFAULT 'draft';
COMMIT;

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_coordinatorId_fkey";

-- DropForeignKey
ALTER TABLE "beneficiaries" DROP CONSTRAINT "beneficiaries_personId_fkey";

-- DropForeignKey
ALTER TABLE "contact_requests" DROP CONSTRAINT "contact_requests_person_id_fkey";

-- DropForeignKey
ALTER TABLE "support_requests" DROP CONSTRAINT "support_requests_person_id_fkey";

-- DropIndex
DROP INDEX "countries_countryCode_key";

-- AlterTable
ALTER TABLE "beneficiaries" RENAME COLUMN "coordinatorId" TO "coordinator_id";
ALTER TABLE "beneficiaries" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "beneficiaries" RENAME COLUMN "updatedAt" TO "updated_at";
ALTER TABLE "beneficiaries" RENAME COLUMN "personId" TO "person_id";

ALTER TABLE "beneficiaries"
DROP COLUMN "details",
ADD COLUMN  "description" VARCHAR(1000),
ADD COLUMN  "private_data" JSONB,
ADD COLUMN  "public_data" JSONB;

-- AlterTable
ALTER TABLE "campaigns" RENAME COLUMN "excerpt" TO "essence";

ALTER TABLE "campaigns"
ALTER COLUMN "state" SET DEFAULT E'draft',
ALTER COLUMN "currency" SET DATA TYPE VARCHAR(3), 
ALTER COLUMN "currency" SET DEFAULT E'BGN';

-- AlterTable
ALTER TABLE "cities" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "countries" RENAME COLUMN "countryCode" TO "country_code";
ALTER TABLE "countries" ALTER COLUMN "name" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "people" RENAME COLUMN "lastName" TO "last_name";
ALTER TABLE "people" ADD COLUMN "email_confirmed" BOOLEAN DEFAULT false;

-- DropTable
DROP TABLE "contact_requests";

-- DropTable
DROP TABLE "support_requests";

-- CreateTable
CREATE TABLE "info_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "person_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "info_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supporters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "person_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "comment" VARCHAR(500),
    "association_member" BOOLEAN NOT NULL DEFAULT false,
    "benefactor_campaign" BOOLEAN NOT NULL DEFAULT false,
    "benefactor_platform" BOOLEAN NOT NULL DEFAULT false,
    "company_other_text" VARCHAR(100),
    "company_sponsor" BOOLEAN NOT NULL DEFAULT false,
    "company_volunteer" BOOLEAN NOT NULL DEFAULT false,
    "partner_bussiness" BOOLEAN NOT NULL DEFAULT false,
    "partner_npo" BOOLEAN NOT NULL DEFAULT false,
    "partner_other_text" VARCHAR(100),
    "role_association_member" BOOLEAN NOT NULL DEFAULT false,
    "role_benefactor" BOOLEAN NOT NULL DEFAULT false,
    "role_company" BOOLEAN NOT NULL DEFAULT false,
    "role_partner" BOOLEAN NOT NULL DEFAULT false,
    "role_volunteer" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_backend" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_designer" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_dev_ops" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_finances_and_accounts" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_frontend" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_lawyer" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_marketing" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_project_manager" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_qa" BOOLEAN NOT NULL DEFAULT false,
    "volunteer_security" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "supporters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_country_code_key" ON "countries"("country_code");

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_coordinator_id_fkey" FOREIGN KEY ("coordinator_id") REFERENCES "coordinators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "info_requests" ADD CONSTRAINT "info_requests_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supporters" ADD CONSTRAINT "supporters_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
