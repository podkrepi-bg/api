-- CreateTable
CREATE TABLE "campaign-document-role" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "campaign-document-role_pkey" PRIMARY KEY ("id")
);
