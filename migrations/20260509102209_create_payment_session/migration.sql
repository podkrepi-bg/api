-- CreateTable
CREATE TABLE "payment_sessions" (
    "jti" VARCHAR(64) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("jti")
);

-- CreateIndex
CREATE INDEX "payment_sessions_expires_at_idx" ON "payment_sessions"("expires_at");
