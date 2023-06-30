/*
  Warnings:

  - You are about to alter the column `slug` on the `campaign_news` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(250)`.
  - A unique constraint covering the columns `[slug]` on the table `campaign_news` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "campaign_news" ALTER COLUMN "slug" SET DATA TYPE VARCHAR(250);

-- CreateIndex
CREATE UNIQUE INDEX "campaign_news_slug_key" ON "campaign_news"("slug");
