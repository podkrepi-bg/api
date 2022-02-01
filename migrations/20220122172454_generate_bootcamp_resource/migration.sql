-- CreateTable
CREATE TABLE "bootcamp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "bootcamp_pkey" PRIMARY KEY ("id")
);
