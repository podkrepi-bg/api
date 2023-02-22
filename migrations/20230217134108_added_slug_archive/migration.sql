-- CreateTable
CREATE TABLE "slug_archive" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(250) NOT NULL,
    "campaign_id" UUID NOT NULL,

    CONSTRAINT "slug_archive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slug_archive_slug_key" ON "slug_archive"("slug");

-- AddForeignKey
ALTER TABLE "slug_archive" ADD CONSTRAINT "slug_archive_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
