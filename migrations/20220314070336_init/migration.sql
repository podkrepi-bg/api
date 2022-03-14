-- CreateTable
CREATE TABLE "bootcamp" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,

    CONSTRAINT "bootcamp_pkey" PRIMARY KEY ("id")
);
