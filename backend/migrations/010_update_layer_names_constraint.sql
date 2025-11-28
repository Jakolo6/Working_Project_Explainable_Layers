-- Migration: Update layer_ratings constraints for new 4-layer structure
-- Run this in Supabase SQL Editor

-- 1. Drop the old layer_name constraint
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_name_check;

-- 2. Drop the old layer_number constraint  
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_number_check;

-- 3. Add new layer_name constraint with updated names
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_layer_name_check 
CHECK (layer_name IN (
    'Complete SHAP Analysis',
    'Analytical Dashboard', 
    'Narrative Explanation',
    'Counterfactual Analysis'
));

-- 4. Add new layer_number constraint (1-4 instead of 1-5)
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_layer_number_check 
CHECK (layer_number >= 1 AND layer_number <= 4);

-- Verify the changes
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'layer_ratings'::regclass;
