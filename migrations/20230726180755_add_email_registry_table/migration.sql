-- CreateEnum
CREATE TYPE "email_type" AS ENUM ('confirmConsent');

-- CreateTable
CREATE TABLE "email_sent_registry" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "date_sent" TIMESTAMPTZ(6) NOT NULL,
    "type" "email_type" NOT NULL,

    CONSTRAINT "email_sent_registry_pkey" PRIMARY KEY ("id")
);
