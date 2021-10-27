-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" "currency" NOT NULL DEFAULT E'BGN';

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" "currency" NOT NULL DEFAULT E'BGN';

-- AlterTable
ALTER TABLE "recurring_donations" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currency" "currency" NOT NULL DEFAULT E'BGN';
