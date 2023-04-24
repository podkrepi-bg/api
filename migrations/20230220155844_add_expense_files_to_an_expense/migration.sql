-- CreateTable
CREATE TABLE "expense_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" VARCHAR(200) NOT NULL,
    "mimetype" VARCHAR(100) NOT NULL,
    "expense_id" UUID NOT NULL,
    "uploader_id" UUID NOT NULL,

    CONSTRAINT "expense_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expense_files" ADD CONSTRAINT "expense_files_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_files" ADD CONSTRAINT "expense_files_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
