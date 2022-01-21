-- CreateTable
CREATE TABLE "Tikva" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Tikva_pkey" PRIMARY KEY ("id")
);
