-- AlterEnum
ALTER TYPE "campaign_file_role" ADD VALUE 'gallery';

-- CreateTable
CREATE TABLE "campaign_news_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(200) NOT NULL,
    "article_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "role" "campaign_file_role" NOT NULL,

    CONSTRAINT "campaign_news_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "campaign_news_files" ADD CONSTRAINT "campaign_news_files_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "campaign_news"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_news_files" ADD CONSTRAINT "campaign_news_files_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
