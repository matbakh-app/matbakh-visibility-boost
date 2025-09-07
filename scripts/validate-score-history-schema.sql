-- Validation Script for Score History Schema
-- Task: 6.4.1 Create ScoreHistory Database Schema
-- Requirements: B.1, B.2

-- Test 1: Verify table exists with correct structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'score_history' 
ORDER BY ordinal_position;

-- Test 2: Verify indexes exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'score_history';

-- Test 3: Verify foreign key constraint
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'score_history';

-- Test 4: Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'score_history';

-- Test 5: Verify RLS policies exist
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'score_history';

-- Test 6: Verify check constraints
SELECT 
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%score_history%';

-- Test 7: Test sample data insertion (if business_partners exist)
DO $$
DECLARE
    test_business_id uuid;
    inserted_count integer;
BEGIN
    -- Get a test business_id (if any exist)
    SELECT id INTO test_business_id 
    FROM business_partners 
    LIMIT 1;
    
    IF test_business_id IS NOT NULL THEN
        -- Insert test score record
        INSERT INTO score_history (
            business_id,
            score_type,
            score_value,
            source,
            meta
        ) VALUES (
            test_business_id,
            'overall_visibility',
            75.5,
            'visibility_check',
            '{"test": true, "validation": "schema_test"}'::jsonb
        );
        
        -- Count inserted records
        SELECT COUNT(*) INTO inserted_count
        FROM score_history 
        WHERE business_id = test_business_id 
            AND meta->>'test' = 'true';
            
        RAISE NOTICE 'Test insertion successful. Records inserted: %', inserted_count;
        
        -- Clean up test data
        DELETE FROM score_history 
        WHERE business_id = test_business_id 
            AND meta->>'test' = 'true';
            
        RAISE NOTICE 'Test data cleaned up successfully';
    ELSE
        RAISE NOTICE 'No business_partners found for testing';
    END IF;
END $$;

-- Test 8: Verify score_value constraints
DO $$
BEGIN
    -- Test valid score value
    BEGIN
        INSERT INTO score_history (
            business_id,
            score_type,
            score_value,
            source
        ) VALUES (
            gen_random_uuid(),
            'overall_visibility',
            50.0,
            'manual_entry'
        );
        RAISE NOTICE 'Valid score value test: PASSED';
        ROLLBACK;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Valid score value test: FAILED - %', SQLERRM;
        ROLLBACK;
    END;
    
    -- Test invalid score value (too high)
    BEGIN
        INSERT INTO score_history (
            business_id,
            score_type,
            score_value,
            source
        ) VALUES (
            gen_random_uuid(),
            'overall_visibility',
            150.0,
            'manual_entry'
        );
        RAISE NOTICE 'Invalid high score test: FAILED (should have been rejected)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Invalid high score test: PASSED (correctly rejected)';
        ROLLBACK;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Invalid high score test: UNEXPECTED ERROR - %', SQLERRM;
        ROLLBACK;
    END;
    
    -- Test invalid score value (negative)
    BEGIN
        INSERT INTO score_history (
            business_id,
            score_type,
            score_value,
            source
        ) VALUES (
            gen_random_uuid(),
            'overall_visibility',
            -10.0,
            'manual_entry'
        );
        RAISE NOTICE 'Invalid negative score test: FAILED (should have been rejected)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Invalid negative score test: PASSED (correctly rejected)';
        ROLLBACK;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Invalid negative score test: UNEXPECTED ERROR - %', SQLERRM;
        ROLLBACK;
    END;
END $$;

-- Test 9: Verify enum constraints
DO $$
BEGIN
    -- Test invalid score_type
    BEGIN
        INSERT INTO score_history (
            business_id,
            score_type,
            score_value,
            source
        ) VALUES (
            gen_random_uuid(),
            'invalid_score_type',
            50.0,
            'manual_entry'
        );
        RAISE NOTICE 'Invalid score_type test: FAILED (should have been rejected)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Invalid score_type test: PASSED (correctly rejected)';
        ROLLBACK;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Invalid score_type test: UNEXPECTED ERROR - %', SQLERRM;
        ROLLBACK;
    END;
    
    -- Test invalid source
    BEGIN
        INSERT INTO score_history (
            business_id,
            score_type,
            score_value,
            source
        ) VALUES (
            gen_random_uuid(),
            'overall_visibility',
            50.0,
            'invalid_source'
        );
        RAISE NOTICE 'Invalid source test: FAILED (should have been rejected)';
        ROLLBACK;
    EXCEPTION WHEN check_violation THEN
        RAISE NOTICE 'Invalid source test: PASSED (correctly rejected)';
        ROLLBACK;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Invalid source test: UNEXPECTED ERROR - %', SQLERRM;
        ROLLBACK;
    END;
END $$;

-- Final summary
SELECT 
    'Score History Schema Validation Complete' AS status,
    NOW() AS validated_at;