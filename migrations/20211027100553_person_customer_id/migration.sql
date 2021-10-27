/*
  Warnings:

  - A unique constraint covering the columns `[keycloak_id]` on the table `people` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripe_customer_id]` on the table `people` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "people" ADD COLUMN     "stripe_customer_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "people_keycloak_id_key" ON "people"("keycloak_id");

-- CreateIndex
CREATE UNIQUE INDEX "people_stripe_customer_id_key" ON "people"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "stripe_customer_id_idx" ON "people"("stripe_customer_id");
