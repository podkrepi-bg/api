/*
  Warnings:

  - You are about to drop the column `withdraw_id` on the `bank_accounts` table. All the data in the column will be lost.
  - You are about to drop the `withdraws` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bank_accounts" DROP CONSTRAINT "bank_accounts_withdraw_id_fkey";

-- DropForeignKey
ALTER TABLE "withdraws" DROP CONSTRAINT "withdraws_vault_id_fkey";

-- AlterTable
ALTER TABLE "bank_accounts" DROP COLUMN "withdraw_id";

-- DropTable
DROP TABLE "withdraws";

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "payout_type" NOT NULL,
    "status" "payout_status" NOT NULL,
    "currency" "currency" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "vault_id" UUID NOT NULL,
    "bank_account_id" UUID NOT NULL,
    "document_id" UUID,
    "target_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_vault_id_fkey" FOREIGN KEY ("vault_id") REFERENCES "vaults"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
