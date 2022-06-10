/*
  Warnings:

  - You are about to drop the column `role` on the `bank_transactions_files` table. All the data in the column will be lost.
  - Added the required column `type` to the `bank_transactions_files` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "bank_transactions_file_type" AS ENUM ('xml', 'other');

-- AlterTable
ALTER TABLE "bank_transactions_files" DROP COLUMN "role",
ADD COLUMN     "type" "bank_transactions_file_type" NOT NULL;

-- DropEnum
DROP TYPE "bank_transactions_file_role";
