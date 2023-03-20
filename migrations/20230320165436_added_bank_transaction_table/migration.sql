-- CreateEnum
CREATE TYPE "bank_transaction_type" AS ENUM ('debit', 'credit');

-- CreateEnum
CREATE TYPE "bank_donation_status" AS ENUM ('unrecognized', 'imported', 'import_failed');

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" VARCHAR(250) NOT NULL,
    "ibanNumber" VARCHAR(34) NOT NULL,
    "bank_name" VARCHAR(50) NOT NULL,
    "bank_id_code" VARCHAR(50) NOT NULL,
    "transaction_date" TIMESTAMPTZ(6) NOT NULL,
    "sender_name" VARCHAR(100),
    "recipient_name" VARCHAR(100),
    "senderIban" VARCHAR(34),
    "recipientIban" VARCHAR(34),
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" "currency" NOT NULL DEFAULT 'BGN',
    "description" VARCHAR(200) NOT NULL,
    "type" "bank_transaction_type" NOT NULL,
    "bankDonationStatus" "bank_donation_status",

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_transactions_id_key" ON "bank_transactions"("id");
