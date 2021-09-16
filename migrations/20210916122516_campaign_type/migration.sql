/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `campaign_types` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "campaign_types_slug_key" ON "campaign_types"("slug");
