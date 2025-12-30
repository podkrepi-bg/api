-- Convert all monetary amounts from BGN to EUR
-- Official fixed exchange rate: 1 EUR = 1.95583 BGN

BEGIN;

-- Set the official BGN to EUR conversion rate
-- 1 EUR = 1.95583 BGN (fixed rate)
DO $$
DECLARE
  bgn_to_eur_rate CONSTANT numeric := 1.95583;
BEGIN
  -- Update campaigns: convert target_amount and currency
  UPDATE campaigns
  SET
    target_amount = ROUND(target_amount / bgn_to_eur_rate),
    currency = 'EUR'
  WHERE currency = 'BGN';

  -- Update vaults: convert amount, blockedAmount and currency
  UPDATE vaults
  SET
    amount = ROUND(amount / bgn_to_eur_rate),
    "blockedAmount" = ROUND("blockedAmount" / bgn_to_eur_rate),
    currency = 'EUR'
  WHERE currency = 'BGN';

  -- Update donations: convert amount (no currency field on donations)
  UPDATE donations
  SET amount = ROUND(amount / bgn_to_eur_rate)
  WHERE payment_id IN (SELECT id FROM payments WHERE currency = 'BGN');
  
  -- Update payments: convert charged_amount, amount and currency
  UPDATE payments
  SET
    charged_amount = ROUND(charged_amount / bgn_to_eur_rate),
    amount = ROUND(amount / bgn_to_eur_rate),
    currency = 'EUR'
  WHERE currency = 'BGN';

  -- Update recurring_donations: convert amount and currency
  UPDATE recurring_donations
  SET
    amount = ROUND(amount / bgn_to_eur_rate),
    currency = 'EUR'
  WHERE currency = 'BGN';

  -- Update transfers: convert amount and currency
  UPDATE transfers
  SET
    amount = ROUND(amount / bgn_to_eur_rate),
    currency = 'EUR'
  WHERE currency = 'BGN';

  -- Update withdrawals: convert amount and currency
  UPDATE withdrawals
  SET
    amount = ROUND(amount / bgn_to_eur_rate),
    currency = 'EUR'
  WHERE currency = 'BGN';

  -- Update expenses: convert amount and currency
  UPDATE expenses
  SET
    amount = ROUND(amount / bgn_to_eur_rate),
    currency = 'EUR'
  WHERE currency = 'BGN';

  -- Update bank_transactions: convert amount (Float) and currency
  UPDATE bank_transactions
  SET
    amount = ROUND((amount / bgn_to_eur_rate)::numeric, 2),
    currency = 'EUR'
  WHERE currency = 'BGN';
END $$;

COMMIT;