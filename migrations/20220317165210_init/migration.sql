-- CreateTable
CREATE TABLE "bootcamp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "bootcamp_pkey" PRIMARY KEY ("id")
);
