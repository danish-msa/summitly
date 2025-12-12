-- Diagnostic query to see what constraints exist on MarketTrends table
-- Run this first to see what constraints are actually in the database

SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'MarketTrends'::regclass
    AND contype = 'u'  -- 'u' = unique constraint
ORDER BY conname;

-- Also check if years column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'MarketTrends'
    AND column_name IN ('years', 'medianListingVsSoldPrice')
ORDER BY column_name;

