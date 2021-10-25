/*
  Warnings:

  - You are about to alter the column `target_amount` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Integer`.
  - You are about to alter the column `reached_amount` on the `campaigns` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Integer`.
  - You are about to alter the column `amount` on the `transfers` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `amount` on the `vaults` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.
  - You are about to alter the column `amount` on the `withdrawals` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Integer`.

*/
-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "target_amount" SET DEFAULT 0,
ALTER COLUMN "target_amount" SET DATA TYPE INTEGER,
ALTER COLUMN "reached_amount" SET DEFAULT 0,
ALTER COLUMN "reached_amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "transfers" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "vaults" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "withdrawals" ALTER COLUMN "amount" SET DEFAULT 0,
ALTER COLUMN "amount" SET DATA TYPE INTEGER;
