-- CreateTable
CREATE TABLE "socket-io-attachments" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" BYTEA NOT NULL,

    CONSTRAINT "socket-io-attachments_pkey" PRIMARY KEY ("id")
);
