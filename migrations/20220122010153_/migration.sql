-- CreateTable
CREATE TABLE "Cat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "Cat_pkey" PRIMARY KEY ("id")
);
