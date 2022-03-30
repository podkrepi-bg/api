/*
  Warnings:

  - You are about to drop the `bootcamp` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "bootcamp" AS ENUM ('todo', 'inProgress', 'forReview', 'done', 'other');

-- DropTable
DROP TABLE "bootcamp";
