/*
  Warnings:

  - You are about to drop the column `reached_amount` on the `campaigns` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "campaigns" DROP COLUMN "reached_amount";

-- CreateVIew
CREATE OR REPLACE VIEW "campaigns_summary" as
SELECT
    c.id as campaign_id,
    SUM(d.amount) as reached_amount
FROM campaigns c
LEFT JOIN vaults v on v.campaign_id = c.id
LEFT JOIN donations d on v.id = d.target_vault_id
WHERE d.status = 'succeeded'::donation_status
GROUP BY
    c.id;
