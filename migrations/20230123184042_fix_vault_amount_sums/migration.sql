-- This migration is needed to fix the incorrectly increased vault amounts when uploading same bank import file multiple times
-- The problem was fixed to not happen anymore in function createManyBankPayments in donation.service.ts

-- Note1: the update is not dangerous, because the vault by design is meant to contain sum of its succeeded donations.
-- Note2: the amounts are calculated for the Admin UI campaign summaries, while the collectedAmounts shown on the campaign page are always calculated by summing donations

UPDATE vaults
SET amount = subquery.sum_amount
FROM (SELECT target_vault_id, SUM(amount) as sum_amount
      FROM donations
      WHERE status = 'succeeded'
      GROUP by target_vault_id) as subquery
WHERE subquery.target_vault_id = id;
