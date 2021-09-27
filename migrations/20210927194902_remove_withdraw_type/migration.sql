/*
  Warnings:

  - You are about to alter the column `name` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `filetype` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3)`.
  - You are about to alter the column `description` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(200)`.
  - You are about to drop the column `type` on the `withdrawals` table. All the data in the column will be lost.
  - Added the required column `filename` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `withdrawals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "withdraw_status" AS ENUM ('initial', 'invalid', 'incomplete', 'declined', 'cancelled', 'succeeded');

-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "filename" VARCHAR(100) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "filetype" SET DATA TYPE VARCHAR(3),
ALTER COLUMN "description" SET DATA TYPE VARCHAR(200);

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "aprovedById" UUID,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "withdrawals" DROP COLUMN "type",
DROP COLUMN "status",
ADD COLUMN     "status" "withdraw_status" NOT NULL;

-- DropEnum
DROP TYPE "payout_status";

-- DropEnum
DROP TYPE "payout_type";

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_aprovedById_fkey" FOREIGN KEY ("aprovedById") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
