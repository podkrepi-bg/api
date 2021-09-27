/*
  Warnings:

  - You are about to drop the `transactions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "donation_type" AS ENUM ('donation');

-- CreateEnum
CREATE TYPE "donation_status" AS ENUM ('initial', 'invalid', 'incomplete', 'declined', 'waiting', 'cancelled', 'succeeded', 'deleted', 'refund', 'paymentRequested');

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_target_vault_id_fkey";

-- DropTable
DROP TABLE "transactions";

-- DropEnum
DROP TYPE "transaction_status";

-- DropEnum
DROP TYPE "transaction_type";

-- CreateTable
CREATE TABLE "donations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "donation_type" NOT NULL,
    "status" "donation_status" NOT NULL DEFAULT E'initial',
    "provider" "payment_provider" NOT NULL DEFAULT E'none',
    "target_vault_id" UUID NOT NULL,
    "customer_id" TEXT NOT NULL,
    "payment_intent_id" TEXT NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_target_vault_id_fkey" FOREIGN KEY ("target_vault_id") REFERENCES "vaults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
