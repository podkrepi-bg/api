/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `campaigns` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "campaigns" ALTER COLUMN "state" SET DEFAULT E'initial';

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_slug_key" ON "campaigns"("slug");
