-- Migration: Remove problematic layer_name constraint
-- Run this in Supabase SQL Editor

-- Simply remove the layer_name constraint - it's not really needed
-- The layer_number constraint (1-4) is sufficient to maintain data integrity
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_name_check;

-- Keep only the layer_number constraint
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_number_check;
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_layer_number_check 
CHECK (layer_number >= 1 AND layer_number <= 4);

-- Verify the constraint is removed
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'layer_ratings'::regclass;
