-- CreateTable
-- CREATE TABLE "campaigns_summary" (
--     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
--     "reached_amount" INTEGER DEFAULT 0,

--     CONSTRAINT "campaigns_summary_pkey" PRIMARY KEY ("id")
-- );

-- AddForeignKey
-- ALTER TABLE "campaigns_summary" ADD CONSTRAINT "campaigns_summary_id_fkey" FOREIGN KEY ("id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateVIew
CREATE OR REPLACE VIEW api.campaigns_summary as
SELECT
    c.id,
    SUM(d.amount) as reached_amount
FROM campaigns c
LEFT JOIN vaults v on v.campaign_id = c.id
LEFT JOIN donations d on v.id = d.target_vault_id
WHERE d.status = 'succeeded'::api.donation_status
GROUP BY
    c.id
