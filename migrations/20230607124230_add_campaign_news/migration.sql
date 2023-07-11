-- CreateEnum
CREATE TYPE "campaign_news_state" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "campaign_news" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "campaign_id" UUID NOT NULL,
    "publisher_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "source_link" TEXT,
    "state" "campaign_news_state" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "published_at" TIMESTAMPTZ(6),
    "edited_at" TIMESTAMPTZ(6),
    "description" TEXT NOT NULL,

    CONSTRAINT "campaign_news_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "campaign_news" ADD CONSTRAINT "campaign_news_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_news" ADD CONSTRAINT "campaign_news_publisher_id_fkey" FOREIGN KEY ("publisher_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
