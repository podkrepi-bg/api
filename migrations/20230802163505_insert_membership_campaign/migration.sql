--insert an internal campaign for members only and their membership fee
--insert an internal campaign for members only and their membership fee
DO $$
DECLARE
  v_coordinator_id UUID;
  v_beneficiary_id UUID;
  v_campaign_type_id UUID;

BEGIN

select id INTO v_coordinator_id from coordinators limit 1;
select id INTO v_beneficiary_id from beneficiaries where coordinator_id = v_coordinator_id limit 1;
select id INTO v_campaign_type_id from campaign_types where name = 'Membership';

IF v_beneficiary_id IS NULL THEN
    RETURN;
END IF;

insert into campaigns (
	state,
	slug,
	title,
	coordinator_id,
	beneficiary_id,
	campaign_type_id,
	essence,
	description,
	target_amount,
	start_date,
	end_date,
	created_at,
	updated_at,
	currency,
	allow_donation_on_complete,
	payment_reference)
values ('approved',
		'podkrepi-membership',
		'Podkrepi.bg membership',
		v_coordinator_id,
		v_beneficiary_id,
		v_campaign_type_id,
		'Internal campaign for members only',
		'Internal campaign for members only. Here you can pay your membership fee. Subscribe it as an annual donation in this campaign.',
		10000000,
		NOW(),
		'2123-08-01',
		NOW(),
		NOW(),
		'BGN',
		true,
		'46M3-3ARQ-R326'
	   );
END;
$$ LANGUAGE plpgsql;

