-- CreateTable
CREATE TABLE "unregistered_notification_consent" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" CITEXT NOT NULL,
    "consent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "unregistered_notification_consent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unregistered_notification_consent_email_key" ON "unregistered_notification_consent"("email");
