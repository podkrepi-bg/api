-- CreateTable
CREATE TABLE "bootcamp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" VARCHAR(50),
    "company" VARCHAR(50),

    CONSTRAINT "bootcamp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bootcamp_email_key" ON "bootcamp"("email");
