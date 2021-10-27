/*
  Warnings:

  - A unique constraint covering the columns `[ext_payment_intent_id]` on the table `donations` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "donations_ext_payment_intent_id_key" ON "donations"("ext_payment_intent_id");
