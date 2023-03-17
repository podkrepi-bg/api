/*
  Warnings:

  - The primary key for the `slug_archive` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `slug_archive` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "slug_archive" DROP CONSTRAINT "slug_archive_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "slug_archive_pkey" PRIMARY KEY ("slug");
