-- CreateTable
CREATE TABLE "bootcamp_Neli" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" CITEXT NOT NULL,

    CONSTRAINT "bootcamp_Neli_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bootcamp_Neli_email_key" ON "bootcamp_Neli"("email");
