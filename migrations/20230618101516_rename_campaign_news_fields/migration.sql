/*
  Warnings:

  - You are about to drop the column `article_id` on the `campaign_news_files` table. All the data in the column will be lost.
  - Added the required column `news_id` to the `campaign_news_files` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "campaign_news_files" DROP CONSTRAINT "campaign_news_files_article_id_fkey";

-- AlterTable
ALTER TABLE "campaign_news_files" DROP COLUMN "article_id",
ADD COLUMN     "news_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "campaign_news_files" ADD CONSTRAINT "campaign_news_files_news_id_fkey" FOREIGN KEY ("news_id") REFERENCES "campaign_news"("id") ON DELETE CASCADE ON UPDATE CASCADE;
