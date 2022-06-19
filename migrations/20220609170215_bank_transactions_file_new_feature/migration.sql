-- CreateEnum
CREATE TYPE "bank_transactions_file_role" AS ENUM ('xml', 'other');

-- CreateTable
CREATE TABLE "bank_transactions_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(200) NOT NULL,
    "mimetype" VARCHAR(50) NOT NULL,
    "bank_transactions_file_id" VARCHAR(50) NOT NULL,
    "role" "bank_transactions_file_role" NOT NULL,

    CONSTRAINT "bank_transactions_files_pkey" PRIMARY KEY ("id")
);
