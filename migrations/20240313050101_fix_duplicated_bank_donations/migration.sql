SET search_path TO api, public;
DO $$
    DECLARE 
        --id of first conflicting bank payment
        payment1Id TEXT:= '19760370-8c4c-4d12-aa33-e10fbb74fdf3';
        --id of second conflicting bank payment
        payment2Id TEXT:= 'e8547131-4803-49f4-93c6-901569667ced';
        d_result INTEGER;
        amountBefore1 INTEGER;
        amountBefore2 INTEGER;
        amountAfter1 INTEGER;
        amountAfter2 INTEGER;
        donation1 RECORD;
        donation2 RECORD;
BEGIN
    WITH deleted as (
        DELETE FROM donations d USING (
        SELECT MIN(ctid) as ctid, payment_id FROM donations 
        GROUP BY  payment_id HAVING COUNT(*) > 1
        ) drecord
        WHERE d.payment_id::text = drecord.payment_id::text AND d.ctid <> drecord.ctid returning d.id 
    )
    SELECT COUNT(*) INTO d_result FROM deleted;
    RAISE NOTICE 'DELETED donations: %', d_result;

    IF d_result = 0 THEN
        RAISE NOTICE 'No conflicting donations found';
        RETURN;
    END IF;

    SELECT * FROM donations INTO donation1 WHERE payment_id::text = payment1Id::text;
    SELECT * FROM donations INTO donation2 WHERE payment_id::text = payment2Id::text;
    RAISE NOTICE 'Found donation with id: %', donation1.id;
    RAISE NOTICE 'Found donation with id: %', donation2.id;

    RAISE NOTICE 'Updating payment with id: %', donation1.payment_id;
    RAISE NOTICE 'Updating payment with id: %', donation2.payment_id; 

    UPDATE payments as p 
    SET status = p_updated.status
    FROM (VALUES
        (donation1.payment_id::uuid, 'succeeded'::text::payment_status),
        (donation2.payment_id::uuid, 'succeeded'::text::payment_status) 
    ) as p_updated(id, status) WHERE p.id::text = p_updated.id::text;
    
    select sum(amount) from vaults into amountBefore1 where id = donation1.target_vault_id;
    select sum(amount) from vaults into amountBefore2 where id = donation2.target_vault_id;

    RAISE NOTICE 'Updating vault with id: %', donation1.target_vault_id;
    RAISE NOTICE 'Updating vault with id: %', donation2.target_vault_id;    
    UPDATE vaults as v
    SET amount = v.amount + updated_vault.amount
    FROM (
    VALUES
        (donation1.target_vault_id::uuid, donation1.amount::INTEGER),
        (donation2.target_vault_id::uuid, donation2.amount::INTEGER)
    ) as updated_vault(id, amount) WHERE v.id::text = updated_vault.id::text;
    
    select sum(amount) from vaults into amountAfter1 where id = donation1.target_vault_id;
    select sum(amount) from vaults into amountAfter2 where id = donation2.target_vault_id;
    
    RAISE NOTICE 'Updated vault with id: %, before: %, after: %', donation1.target_vault_id, amountBefore1, amountAfter1;
    RAISE NOTICE 'Updated vault with id: %, before: %, after: %', donation2.target_vault_id, amountBefore2, amountAfter2;    
END $$;
