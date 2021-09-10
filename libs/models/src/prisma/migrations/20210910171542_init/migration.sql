CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "beneficiary_type" AS ENUM ('Individual', 'Organisation');

-- CreateEnum
CREATE TYPE "campaign_state" AS ENUM ('Initial', 'Draft', 'PendingValidation', 'Approved', 'Rejected', 'Active', 'ActivePendingValidation', 'Suspended', 'Complete', 'Disabled', 'Error');

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" CITEXT,
    "phone" VARCHAR(50),
    "company" VARCHAR(50),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "person_id" UUID NOT NULL,

    CONSTRAINT "coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "beneficiary_type" NOT NULL,
    "personId" UUID NOT NULL,
    "coordinatorId" UUID NOT NULL,
    "country_code" CITEXT NOT NULL,
    "city_id" UUID NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6),

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),

    CONSTRAINT "campaign_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "state" "campaign_state" NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "excerpt" VARCHAR(500) NOT NULL,
    "coordinator_id" UUID NOT NULL,
    "beneficiary_id" UUID NOT NULL,
    "campaign_type_id" UUID NOT NULL,
    "description" TEXT,
    "target_amount" DECIMAL,
    "currency" TEXT DEFAULT E'BGN',
    "start_date" TIMESTAMPTZ(6),
    "end_date" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "person_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6),
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "person_id" UUID NOT NULL,
    "support_data" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "support_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "postal_code" INTEGER NOT NULL,
    "country_id" UUID NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "countryCode" CITEXT NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_email_key" ON "people"("email");

-- CreateIndex
CREATE INDEX "campaigns_campaign_type_id_idx" ON "campaigns"("campaign_type_id");

-- AddForeignKey
ALTER TABLE "coordinators" ADD CONSTRAINT "coordinators_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "coordinators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_beneficiary_id_fkey" FOREIGN KEY ("beneficiary_id") REFERENCES "beneficiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_campaign_type_id_fkey" FOREIGN KEY ("campaign_type_id") REFERENCES "campaign_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_requests" ADD CONSTRAINT "support_requests_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
