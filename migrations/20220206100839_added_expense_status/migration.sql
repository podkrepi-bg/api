/*
  Warnings:

  - Added the required column `status` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('pending', 'approved', 'canceled', 'deleted');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "status" "ExpenseStatus" NOT NULL;
