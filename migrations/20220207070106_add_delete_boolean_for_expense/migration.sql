/*
  Warnings:

  - The values [deleted] on the enum `ExpenseStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ExpenseStatus_new" AS ENUM ('pending', 'approved', 'canceled');
ALTER TABLE "expenses" ALTER COLUMN "status" TYPE "ExpenseStatus_new" USING ("status"::text::"ExpenseStatus_new");
ALTER TYPE "ExpenseStatus" RENAME TO "ExpenseStatus_old";
ALTER TYPE "ExpenseStatus_new" RENAME TO "ExpenseStatus";
DROP TYPE "ExpenseStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "deleted" BOOLEAN NOT NULL DEFAULT false;
