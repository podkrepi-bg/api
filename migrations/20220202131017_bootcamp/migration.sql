-- CreateTable
CREATE TABLE "BootcampIntern" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "BootcampIntern_pkey" PRIMARY KEY ("id")
);