-- Migration: Update layer_ratings constraints for new layer names (v2)
-- Run this in Supabase SQL Editor

-- 1. Drop the old layer_name constraint
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_name_check;

-- 2. Add new layer_name constraint with updated names
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_layer_name_check 
CHECK (layer_name IN (
    'Baseline SHAP Explanation',
    'Interactive Dashboard', 
    'Narrative Explanation',
    'Counterfactual Analysis'
));

-- Verify the changes
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'layer_ratings'::regclass;
