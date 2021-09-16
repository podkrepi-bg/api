/*
  Warnings:

  - A unique constraint covering the columns `[countryCode]` on the table `countries` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "countries_countryCode_key" ON "countries"("countryCode");
