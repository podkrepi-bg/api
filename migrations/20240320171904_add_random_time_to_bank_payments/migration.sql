-- This is an empty migration.
UPDATE donations
SET created_at = donations.created_at::timestamp 
                + (floor(random() * (23 - 1 + 1) + 1)::int || ' hours')::interval  
                + (floor(random() * (59 - 1 + 1) + 1)::int || ' minutes')::interval 
                + (floor(random() * (59 - 1 + 1) + 1)::int || ' seconds')::interval 
                + (floor(random() * (999 - 1 + 1) + 100)::int || ' milliseconds')::interval
FROM payments WHERE payments.id::text = donations.payment_id::text AND payments.provider::text = 'bank' AND donations.created_at::date < '2024-03-10'