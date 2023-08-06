-- CreateTable
CREATE TABLE "marketing_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT,

    CONSTRAINT "marketing_templates_pkey" PRIMARY KEY ("id")
);
