BEGIN;

CREATE TABLE "donations_temp" AS TABLE donations;

--Rename donation_status to payment_status
CREATE TYPE "payment_status" AS ENUM ('initial', 'invalid', 'incomplete', 'declined', 'waiting', 'cancelled', 'guaranteed', 'succeeded', 'deleted', 'refund', 'paymentRequested');
CREATE TYPE "payment_type" AS ENUM ('single', 'category', 'benevity');


--Drop constraints as donation table will be truncated
--Constraints will be re-added before the transaction is commited
ALTER TABLE "donation_metadata" DROP CONSTRAINT "donation_metadata_donation_id_fkey";
ALTER TABLE "donation_wishes" DROP CONSTRAINT "donation_wishes_donation_id_fkey";

--Delete all existing records of donation 
TRUNCATE donations;

-- Remove redundant fields, indexes and constraint from donations table. Add payment_id field
ALTER TABLE "donations" 
    DROP COLUMN "affiliate_id",
    DROP COLUMN "billing_email",
    DROP COLUMN "billing_name",
    DROP COLUMN "chargedAmount",
    DROP COLUMN "ext_customer_id",
    DROP COLUMN "ext_payment_intent_id",
    DROP COLUMN "ext_payment_method_id",
    DROP COLUMN "currency",
    DROP COLUMN "provider",
    DROP COLUMN "status",
    ADD COLUMN "payment_id" UUID NOT NULL;



--Create Payments table
CREATE TABLE payments (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ext_customer_id" VARCHAR(50) NOT NULL,
    "ext_payment_intent_id" TEXT NOT NULL,
    "ext_payment_method_id" TEXT NOT NULL,
    "type" "payment_type" NOT NULL,
    "currency" "currency" NOT NULL DEFAULT 'BGN',
    "status" "payment_status" NOT NULL DEFAULT 'initial',
    "provider" "payment_provider" NOT NULL DEFAULT 'none',
    "affiliate_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "charged_amount" INTEGER NOT NULL DEFAULT 0,
	"amount" INTEGER NOT NULL DEFAULT 0,
    "billing_email" VARCHAR,
    "billing_name" VARCHAR,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

--Add donation<->payments relation
ALTER TABLE "donations" ADD CONSTRAINT "donations_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "payments_ext_payment_intent_id_key" ON "payments"("ext_payment_intent_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
DO $$
DECLARE 
    dbrow RECORD;
    payment_result RECORD;
    old_donation_count INTEGER;
    payments_count INTEGER;
    new_donation_count INTEGER;
    l_context TEXT;

  BEGIN 
RAISE DEBUG '==FILL TABLES==';
  FOR dbrow IN SELECT * FROM "donations_temp" 
  LOOP
  RAISE DEBUG '%', dbrow;
  WITH payment AS (
      INSERT INTO payments ("ext_customer_id", 
                            "ext_payment_intent_id", 
                            "ext_payment_method_id", 
                            "type", 
                            "currency", 
                            "status", 
                            "provider", 
                            "affiliate_id", 
                            "created_at",
                            "updated_at",
                            "charged_amount",
							"amount",
                            "billing_email",
                            "billing_name")
      VALUES (
        dbrow.ext_customer_id,
        dbrow.ext_payment_intent_id,
        dbrow.ext_payment_method_id,
        'single',
        dbrow.currency,
        dbrow.status::TEXT::payment_status,
        dbrow.provider,
        dbrow.affiliate_id,
        dbrow.created_at,
        dbrow.updated_at,
        dbrow."chargedAmount",
		dbrow.amount,
        dbrow.billing_email,
        dbrow.billing_name
      ) RETURNING id
  )

    SELECT * INTO payment_result FROM payment;
    INSERT INTO "donations" (id, payment_id, "type", target_vault_id, amount, person_id, created_at, updated_at)
    VALUES(dbrow.id, payment_result.id, dbrow.type, dbrow.target_vault_id, dbrow.amount, dbrow.person_id, dbrow.created_at, dbrow.updated_at);

  END LOOP;
RAISE DEBUG '==END FILL TABLES==';

SELECT COUNT(*)::INTEGER INTO old_donation_count FROM donations_temp;
SELECT COUNT(*)::INTEGER INTO payments_count FROM payments;
SELECT COUNT (*)::INTEGER  INTO new_donation_count FROM donations; 

ASSERT old_donation_count = payments_count,  'Mismatch of old and new versions';
ASSERT old_donation_count = new_donation_count, 'Mismatch of old and new versions';
ASSERT payments_count = new_donation_count, 'Payments and Donations have different length';
END$$;

-- Add constraints
ALTER TABLE "donation_metadata" ADD CONSTRAINT "donation_metadata_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "donation_wishes" ADD CONSTRAINT "donation_wishes_donation_id_fkey" FOREIGN KEY ("donation_id") REFERENCES "donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

--DROP temp dable
DROP TABLE "donations_temp";
DROP TYPE "donation_status";
COMMIT;