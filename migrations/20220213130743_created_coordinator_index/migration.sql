/*
  Warnings:

  - A unique constraint covering the columns `[person_id]` on the table `coordinators` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "coordinators_person_id_key" ON "coordinators"("person_id");
