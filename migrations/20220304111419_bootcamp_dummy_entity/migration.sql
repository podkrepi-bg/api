-- CreateTable
CREATE TABLE "BootcampSimeon" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first-name" VARCHAR(50) NOT NULL,
    "last-name" VARCHAR(50) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(50),

    CONSTRAINT "BootcampSimeon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BootcampSimeon_email_key" ON "BootcampSimeon"("email");
